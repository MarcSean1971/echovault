
/**
 * FIXED: Service functions for creating reminder schedules - REJECTS panic triggers
 */

import { supabase } from "@/integrations/supabase/client";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * FIXED: Create reminder schedule - REJECTS panic triggers immediately
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] FIXED: Creating reminder schedule for:", params);
    
    // CRITICAL FIX: Reject panic triggers immediately
    if (params.conditionType === 'panic_trigger') {
      console.log("[REMINDER-SERVICE] REJECTING panic trigger - panic triggers do not have reminder schedules!");
      return false;
    }
    
    // Calculate schedule times for time-based conditions only
    const scheduleTimes = calculateScheduleTimes(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated for condition type:", params.conditionType);
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries`);
    scheduleTimes.forEach(entry => {
      console.log(`[REMINDER-SERVICE] - ${entry.reminder_type} at ${entry.scheduled_at}`);
    });
    
    // Try to create reminder entries
    return await createScheduleEntries(scheduleTimes, params, isEdit);
    
  } catch (error) {
    console.error("[REMINDER-SERVICE] Unexpected error in createOrUpdateReminderSchedule:", error);
    
    // Try fallback server-side creation
    console.log("[REMINDER-SERVICE] Attempting server-side fallback after exception...");
    return await createRemindersServerSide(params);
  }
}

/**
 * FIXED: Create schedule entries with proper error handling
 */
async function createScheduleEntries(scheduleEntries: any[], params: ReminderScheduleParams, isEdit: boolean): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Attempting to insert reminder schedule entries...");
    
    const { data, error } = await supabase
      .from('reminder_schedule')
      .insert(scheduleEntries)
      .select();
      
    if (error) {
      console.error("[REMINDER-SERVICE] Database error creating reminder schedule:", {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Try fallback server-side creation if client-side fails
      console.log("[REMINDER-SERVICE] Attempting server-side fallback...");
      return await createRemindersServerSide(params);
    }
    
    console.log(`[REMINDER-SERVICE] Successfully created ${data?.length || 0} reminder entries:`, data);
    
    // ONLY mark old reminders as obsolete AFTER new ones are successfully created
    await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    
    return true;
    
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error creating schedule entries:", error);
    return await createRemindersServerSide(params);
  }
}

/**
 * Fallback: Create reminders server-side via edge function
 */
async function createRemindersServerSide(params: ReminderScheduleParams): Promise<boolean> {
  try {
    // REJECT panic triggers at server-side level too
    if (params.conditionType === 'panic_trigger') {
      console.log("[REMINDER-SERVICE] Server-side also rejecting panic trigger");
      return false;
    }
    
    console.log("[REMINDER-SERVICE] Using server-side reminder creation fallback");
    
    const { data, error } = await supabase.functions.invoke('process-simple-reminders', {
      body: {
        action: 'create_schedule',
        messageId: params.messageId,
        conditionId: params.conditionId,
        conditionType: params.conditionType,
        reminderMinutes: params.reminderMinutes,
        triggerDate: params.triggerDate,
        lastChecked: params.lastChecked,
        hoursThreshold: params.hoursThreshold,
        minutesThreshold: params.minutesThreshold,
        source: 'client_fallback'
      }
    });
    
    if (error) {
      console.error("[REMINDER-SERVICE] Server-side fallback failed:", error);
      return false;
    }
    
    console.log("[REMINDER-SERVICE] Server-side reminder creation succeeded:", data);
    return data?.success || false;
    
  } catch (error) {
    console.error("[REMINDER-SERVICE] Server-side fallback exception:", error);
    return false;
  }
}

/**
 * FIXED: Calculate reminder schedule times - ONLY for time-based conditions
 */
function calculateScheduleTimes(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  console.log("[REMINDER-SERVICE] Calculating schedule times with params:", {
    conditionType,
    reminderMinutes,
    triggerDate,
    lastChecked,
    hoursThreshold,
    minutesThreshold
  });
  
  // CRITICAL: Reject panic triggers
  if (conditionType === 'panic_trigger') {
    console.error("[REMINDER-SERVICE] ERROR: Panic triggers should not have reminder schedules!");
    return [];
  }
  
  // Calculate deadline based on condition type
  let deadline: Date | null = null;
  const now = new Date();
  
  if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold !== undefined || minutesThreshold !== undefined)) {
    const lastCheckedDate = new Date(lastChecked);
    deadline = new Date(lastCheckedDate);
    
    if (hoursThreshold) {
      deadline.setHours(deadline.getHours() + hoursThreshold);
    }
    
    if (minutesThreshold) {
      deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
    }
    
    console.log(`[REMINDER-SERVICE] Check-in deadline: ${deadline.toISOString()}`);
  } else if (triggerDate) {
    deadline = new Date(triggerDate);
    console.log(`[REMINDER-SERVICE] Trigger deadline: ${deadline.toISOString()}`);
  } else {
    console.warn("[REMINDER-SERVICE] No deadline could be determined for condition type:", conditionType);
    return [];
  }
  
  if (!deadline) {
    console.error("[REMINDER-SERVICE] No valid deadline calculated");
    return [];
  }
  
  const scheduleEntries = [];
  
  // SPECIAL HANDLING: If deadline has passed, create IMMEDIATE entries
  if (deadline <= now) {
    console.log(`[REMINDER-SERVICE] Deadline has passed! Creating IMMEDIATE entries`);
    
    // Immediate check-in reminder (for past-due check-ins)
    if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType)) {
      scheduleEntries.push({
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: new Date(now.getTime() + 10000).toISOString(), // 10 seconds
        reminder_type: 'reminder',
        status: 'pending',
        delivery_priority: 'critical',
        retry_strategy: 'aggressive'
      });
    }
    
    // Immediate final delivery
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: new Date(now.getTime() + 30000).toISOString(), // 30 seconds
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
    
    console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} immediate entries`);
    return scheduleEntries;
  }
  
  // For future deadlines, create normal schedule
  
  // FIXED: Handle reminder minutes properly
  const validReminderMinutes = Array.isArray(reminderMinutes) ? reminderMinutes : [];
  
  // Create check-in reminders at specified intervals before deadline
  for (const minutes of validReminderMinutes) {
    const reminderTime = new Date(deadline.getTime() - (minutes * 60 * 1000));
    
    // Only create reminders that are in the future
    if (reminderTime <= now) {
      console.warn(`[REMINDER-SERVICE] Reminder ${minutes} mins before deadline would be in the past, skipping`);
      continue;
    }
    
    console.log(`[REMINDER-SERVICE] Creating reminder ${minutes} mins before deadline at ${reminderTime.toISOString()}`);
    
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: reminderTime.toISOString(),
      reminder_type: 'reminder',
      status: 'pending',
      delivery_priority: 'normal',
      retry_strategy: 'standard'
    });
  }
  
  // ALWAYS add final delivery at exact deadline
  console.log(`[REMINDER-SERVICE] Adding final delivery at deadline: ${deadline.toISOString()}`);
  
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: deadline.toISOString(),
    reminder_type: 'final_delivery',
    status: 'pending',
    delivery_priority: 'high',
    retry_strategy: 'standard'
  });
  
  console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} total schedule entries`);
  return scheduleEntries;
}
