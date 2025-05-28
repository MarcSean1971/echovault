/**
 * Service functions for creating and managing reminder schedules
 * FIXED: Added proper deduplication to prevent multiple check-in reminder emails
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * Create or update reminder schedule with proper deduplication
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating reminder schedule with deduplication for:", params);
    console.log("[REMINDER-SERVICE] Is edit operation:", isEdit);
    
    // CRITICAL FIX: Check for existing pending reminders first
    const { data: existingReminders, error: checkError } = await supabase
      .from('reminder_schedule')
      .select('id, reminder_type, scheduled_at')
      .eq('message_id', params.messageId)
      .eq('condition_id', params.conditionId)
      .eq('status', 'pending');
      
    if (checkError) {
      console.error("[REMINDER-SERVICE] Error checking existing reminders:", checkError);
    } else if (existingReminders && existingReminders.length > 0) {
      console.log(`[REMINDER-SERVICE] Found ${existingReminders.length} existing pending reminders - will clean up duplicates`);
      
      // Mark existing reminders as obsolete to prevent duplicates
      await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    }
    
    // Calculate scheduled times - SIMPLIFIED to create only ONE reminder per condition
    const scheduleTimes = calculateSimplifiedSchedule(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries (deduplicated)`);
    scheduleTimes.forEach(entry => {
      console.log(`[REMINDER-SERVICE] - ${entry.reminder_type} at ${entry.scheduled_at}`);
    });
    
    // Create reminder entries with proper conflict handling
    const { data, error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleTimes, {
        onConflict: 'message_id,condition_id,reminder_type',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error("[REMINDER-SERVICE] Error creating reminder schedule:", error);
      return false;
    }
    
    // Verify reminders were created
    const { count, error: countError } = await supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('message_id', params.messageId)
      .eq('condition_id', params.conditionId)
      .eq('status', 'pending');
      
    if (countError) {
      console.error("[REMINDER-SERVICE] Error verifying reminder count:", countError);
    } else {
      console.log(`[REMINDER-SERVICE] Verified ${count} pending reminders exist for message ${params.messageId}`);
    }
    
    console.log(`[REMINDER-SERVICE] Successfully created deduplicated reminder schedule entries`);
    
    // Broadcast update event
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        messageId: params.messageId,
        conditionId: params.conditionId,
        updatedAt: new Date().toISOString(),
        action: 'reminder-schedule-created'
      }
    }));
    
    // For immediate final deliveries, trigger processing right away but only if message is past due
    const finalDelivery = scheduleTimes.find(entry => 
      entry.reminder_type === 'final_delivery' && 
      new Date(entry.scheduled_at) <= new Date()
    );
    
    if (finalDelivery) {
      console.log(`[REMINDER-SERVICE] Triggering immediate processing for past-due final delivery`);
      await triggerImmediateProcessing(params.messageId);
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * Calculate reminder schedule times - SIMPLIFIED version that creates only ONE final delivery
 * and ONE reminder per message to prevent duplicate emails
 */
function calculateSimplifiedSchedule(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  // Calculate effective deadline
  let effectiveDeadline: Date | null = null;
  const now = new Date();
  
  if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold !== undefined || minutesThreshold !== undefined)) {
    const lastCheckedDate = new Date(lastChecked);
    effectiveDeadline = new Date(lastCheckedDate);
    
    if (hoursThreshold) {
      effectiveDeadline.setHours(effectiveDeadline.getHours() + hoursThreshold);
    }
    
    if (minutesThreshold) {
      effectiveDeadline.setMinutes(effectiveDeadline.getMinutes() + minutesThreshold);
    }
    
    console.log(`[REMINDER-SERVICE] Calculated deadline: ${effectiveDeadline.toISOString()}`);
  } else if (triggerDate) {
    effectiveDeadline = new Date(triggerDate);
    console.log(`[REMINDER-SERVICE] Using trigger date: ${effectiveDeadline.toISOString()}`);
  } else {
    console.warn("[REMINDER-SERVICE] No deadline could be determined");
    return [];
  }
  
  if (!effectiveDeadline) {
    return [];
  }
  
  const scheduleEntries = [];
  
  // If deadline has passed, create IMMEDIATE final delivery only
  if (effectiveDeadline <= now) {
    console.log(`[REMINDER-SERVICE] CRITICAL: Deadline has passed! Creating IMMEDIATE final delivery`);
    const immediateTime = new Date(now.getTime() + 10000); // 10 seconds from now
    
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: immediateTime.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
    
    return scheduleEntries;
  }
  
  // SIMPLIFIED: Create ONLY ONE reminder (the earliest one) to prevent duplicate emails
  if (reminderMinutes && reminderMinutes.length > 0) {
    // Find the earliest valid reminder time
    const sortedMinutes = [...reminderMinutes].sort((a, b) => b - a); // Sort descending to get earliest reminder first
    let earliestValidReminderTime: Date | null = null;
    
    for (const minutes of sortedMinutes) {
      const reminderTime = new Date(effectiveDeadline.getTime() - (minutes * 60 * 1000));
      if (reminderTime > now) {
        earliestValidReminderTime = reminderTime;
        break;
      }
    }
    
    if (earliestValidReminderTime) {
      scheduleEntries.push({
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: earliestValidReminderTime.toISOString(),
        reminder_type: 'reminder',
        status: 'pending',
        delivery_priority: 'normal',
        retry_strategy: 'standard'
      });
    }
  }
  
  // ALWAYS add final delivery at exact deadline to ensure messages are sent
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: effectiveDeadline.toISOString(),
    reminder_type: 'final_delivery',
    status: 'pending',
    delivery_priority: 'critical',
    retry_strategy: 'aggressive'
  });
  
  console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} total reminder entries - SIMPLIFIED to prevent duplicates`);
  return scheduleEntries;
}

/**
 * Trigger immediate processing for past-due conditions
 */
async function triggerImmediateProcessing(messageId: string): Promise<void> {
  console.log(`[REMINDER-SERVICE] Triggering immediate processing for message ${messageId}`);
  
  try {
    const { error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId: messageId,
        debug: true,
        forceSend: true,
        source: "immediate-past-due-trigger"
      }
    });
    
    if (error) {
      console.error("[REMINDER-SERVICE] Error triggering immediate processing:", error);
    } else {
      console.log("[REMINDER-SERVICE] Successfully triggered immediate processing");
    }
  } catch (error) {
    console.error("[REMINDER-SERVICE] Exception in immediate processing:", error);
  }
}
