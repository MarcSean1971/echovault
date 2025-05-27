
/**
 * RADICALLY SIMPLIFIED: Service functions for creating reminder schedules
 * Creates entries in reminder_schedule table with proper timing
 */

import { supabase } from "@/integrations/supabase/client";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * Create reminder schedule - SIMPLIFIED with clear timing
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating SIMPLE reminder schedule for:", params);
    
    // Mark existing reminders as obsolete first
    await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    
    // Calculate simple schedule times
    const scheduleTimes = calculateSimpleScheduleTimes(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} simple schedule entries`);
    scheduleTimes.forEach(entry => {
      console.log(`[REMINDER-SERVICE] - ${entry.reminder_type} at ${entry.scheduled_at}`);
    });
    
    // Create reminder entries
    const { data, error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleTimes, {
        onConflict: 'message_id,condition_id,scheduled_at,reminder_type',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error("[REMINDER-SERVICE] Error creating reminder schedule:", error);
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Successfully created ${scheduleTimes.length} reminder entries`);
    return true;
    
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * SIMPLIFIED: Calculate reminder schedule times
 */
function calculateSimpleScheduleTimes(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  // Calculate deadline
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
    console.warn("[REMINDER-SERVICE] No deadline could be determined");
    return [];
  }
  
  if (!deadline) {
    return [];
  }
  
  const scheduleEntries = [];
  
  // If deadline has passed, create IMMEDIATE entries
  if (deadline <= now) {
    console.log(`[REMINDER-SERVICE] Deadline has passed! Creating IMMEDIATE entries`);
    
    // Immediate check-in reminder (for past-due check-ins)
    if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType)) {
      scheduleEntries.push({
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: new Date(now.getTime() + 10000).toISOString(), // 10 seconds
        reminder_type: 'reminder',
        status: 'pending'
      });
    }
    
    // Immediate final delivery
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: new Date(now.getTime() + 30000).toISOString(), // 30 seconds
      reminder_type: 'final_delivery',
      status: 'pending'
    });
    
    return scheduleEntries;
  }
  
  // For future deadlines, create normal schedule
  
  // Create check-in reminders at specified intervals before deadline
  for (const minutes of reminderMinutes) {
    const reminderTime = new Date(deadline.getTime() - (minutes * 60 * 1000));
    
    // Only create reminders that are in the future
    if (reminderTime <= now) {
      console.warn(`[REMINDER-SERVICE] Reminder ${minutes} mins before deadline would be in the past, skipping`);
      continue;
    }
    
    console.log(`[REMINDER-SERVICE] Creating check-in reminder ${minutes} mins before deadline at ${reminderTime.toISOString()}`);
    
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: reminderTime.toISOString(),
      reminder_type: 'reminder',
      status: 'pending'
    });
  }
  
  // ALWAYS add final delivery at exact deadline
  console.log(`[REMINDER-SERVICE] Adding final delivery at deadline: ${deadline.toISOString()}`);
  
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: deadline.toISOString(),
    reminder_type: 'final_delivery',
    status: 'pending'
  });
  
  console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} total schedule entries`);
  return scheduleEntries;
}
