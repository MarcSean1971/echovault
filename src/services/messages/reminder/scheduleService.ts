
/**
 * Service functions for creating and managing reminder schedules
 * FIXED: Corrected time calculation to ensure future scheduled times
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
    
    // Calculate scheduled times - FIXED to ensure future times
    const scheduleTimes = calculateFixedSchedule(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries (with proper future times)`);
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
    
    console.log(`[REMINDER-SERVICE] Successfully created reminder schedule with proper future times`);
    
    // Broadcast update event
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        messageId: params.messageId,
        conditionId: params.conditionId,
        updatedAt: new Date().toISOString(),
        action: 'reminder-schedule-created'
      }
    }));
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * FIXED: Calculate reminder schedule times with proper future time validation
 */
function calculateFixedSchedule(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  const now = new Date();
  console.log(`[REMINDER-SERVICE] Current time: ${now.toISOString()}`);
  
  // Calculate effective deadline with FIXED logic
  let effectiveDeadline: Date | null = null;
  
  if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold !== undefined || minutesThreshold !== undefined)) {
    const lastCheckedDate = new Date(lastChecked);
    
    // CRITICAL FIX: Calculate deadline as lastChecked + threshold (not just lastChecked)
    effectiveDeadline = new Date(lastCheckedDate);
    
    if (hoursThreshold) {
      effectiveDeadline.setHours(effectiveDeadline.getHours() + hoursThreshold);
    }
    
    if (minutesThreshold) {
      effectiveDeadline.setMinutes(effectiveDeadline.getMinutes() + minutesThreshold);
    }
    
    console.log(`[REMINDER-SERVICE] FIXED Check-in deadline calculation:`);
    console.log(`[REMINDER-SERVICE] - Last checked: ${lastCheckedDate.toISOString()}`);
    console.log(`[REMINDER-SERVICE] - Hours threshold: ${hoursThreshold || 0}`);
    console.log(`[REMINDER-SERVICE] - Minutes threshold: ${minutesThreshold || 0}`);
    console.log(`[REMINDER-SERVICE] - Calculated deadline: ${effectiveDeadline.toISOString()}`);
    
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
  
  // CRITICAL FIX: Ensure deadline is in the future
  if (effectiveDeadline <= now) {
    console.log(`[REMINDER-SERVICE] Deadline ${effectiveDeadline.toISOString()} is in the past or too close - adjusting to future time`);
    
    // For check-in conditions that are overdue, set a reasonable future deadline
    if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType)) {
      // Set deadline to at least 30 minutes from now for overdue check-ins
      effectiveDeadline = new Date(now.getTime() + 30 * 60 * 1000);
      console.log(`[REMINDER-SERVICE] Adjusted check-in deadline to: ${effectiveDeadline.toISOString()}`);
    } else {
      // For other conditions, create immediate final delivery
      const immediateTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
      
      scheduleEntries.push({
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: immediateTime.toISOString(),
        reminder_type: 'final_delivery',
        status: 'pending',
        delivery_priority: 'critical',
        retry_strategy: 'aggressive'
      });
      
      console.log(`[REMINDER-SERVICE] Created immediate final delivery at ${immediateTime.toISOString()}`);
      return scheduleEntries;
    }
  }
  
  // FIXED: Create reminder entries with proper future time validation
  if (reminderMinutes && reminderMinutes.length > 0) {
    // Sort reminder minutes in descending order to get the earliest (largest) one first
    const sortedMinutes = [...reminderMinutes].sort((a, b) => b - a);
    
    for (const minutes of sortedMinutes) {
      // CRITICAL FIX: Calculate reminder time as deadline MINUS the minutes
      const reminderTime = new Date(effectiveDeadline.getTime() - (minutes * 60 * 1000));
      
      console.log(`[REMINDER-SERVICE] Checking reminder ${minutes} minutes before deadline:`);
      console.log(`[REMINDER-SERVICE] - Deadline: ${effectiveDeadline.toISOString()}`);
      console.log(`[REMINDER-SERVICE] - Reminder time: ${reminderTime.toISOString()}`);
      console.log(`[REMINDER-SERVICE] - Current time: ${now.toISOString()}`);
      console.log(`[REMINDER-SERVICE] - Is future? ${reminderTime > now}`);
      
      // CRITICAL FIX: Only create reminders that are in the future (at least 2 minutes)
      if (reminderTime > new Date(now.getTime() + 2 * 60 * 1000)) {
        scheduleEntries.push({
          message_id: messageId,
          condition_id: conditionId,
          scheduled_at: reminderTime.toISOString(),
          reminder_type: 'reminder',
          status: 'pending',
          delivery_priority: 'normal',
          retry_strategy: 'standard'
        });
        
        console.log(`[REMINDER-SERVICE] ✓ Created reminder for ${minutes} minutes before deadline at ${reminderTime.toISOString()}`);
        break; // Only create ONE reminder to prevent duplicates
      } else {
        console.log(`[REMINDER-SERVICE] ✗ Skipping reminder ${minutes} minutes before deadline - would be at ${reminderTime.toISOString()} (too close to now)`);
      }
    }
  }
  
  // ALWAYS add final delivery at deadline if it's in the future
  if (effectiveDeadline > new Date(now.getTime() + 2 * 60 * 1000)) {
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: effectiveDeadline.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
    
    console.log(`[REMINDER-SERVICE] ✓ Created final delivery at ${effectiveDeadline.toISOString()}`);
  } else {
    console.warn(`[REMINDER-SERVICE] ✗ Deadline ${effectiveDeadline.toISOString()} is too close to now, skipping final delivery`);
  }
  
  console.log(`[REMINDER-SERVICE] FINAL: Created ${scheduleEntries.length} total reminder entries with proper future times`);
  
  // VALIDATION: Ensure all reminders are in the future
  const invalidReminders = scheduleEntries.filter(entry => new Date(entry.scheduled_at) <= now);
  if (invalidReminders.length > 0) {
    console.error(`[REMINDER-SERVICE] ERROR: Found ${invalidReminders.length} reminders with past times!`);
    invalidReminders.forEach(entry => {
      console.error(`[REMINDER-SERVICE] - Invalid: ${entry.reminder_type} at ${entry.scheduled_at}`);
    });
    return []; // Don't create any reminders if validation fails
  }
  
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
