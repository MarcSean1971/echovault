
/**
 * Service functions for creating and managing reminder schedules
 * FIXED: Ensure final delivery is always scheduled and immediate entries for past-due conditions
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * Create or update reminder schedule - SIMPLIFIED with immediate final delivery for past-due
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating reminder schedule for:", params);
    console.log("[REMINDER-SERVICE] Is edit operation:", isEdit);
    
    // Mark existing reminders as obsolete first
    await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    
    // Calculate scheduled times with IMMEDIATE final delivery for past-due conditions
    const scheduleTimes = calculateScheduleTimesWithImmediateDelivery(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries`);
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
    
    console.log(`[REMINDER-SERVICE] Successfully created ${scheduleTimes.length} reminder schedule entries`);
    
    // Broadcast update event
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        messageId: params.messageId,
        conditionId: params.conditionId,
        updatedAt: new Date().toISOString(),
        action: 'reminder-schedule-created'
      }
    }));
    
    // For immediate final deliveries, trigger processing right away
    const immediateEntries = scheduleTimes.filter(entry => 
      entry.reminder_type === 'final_delivery' && 
      new Date(entry.scheduled_at) <= new Date(Date.now() + 30000) // Within 30 seconds
    );
    
    if (immediateEntries.length > 0) {
      console.log(`[REMINDER-SERVICE] Triggering immediate processing for ${immediateEntries.length} past-due final deliveries`);
      await triggerImmediateProcessing(params.messageId);
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * SIMPLIFIED: Calculate reminder schedule times with immediate final delivery for past-due conditions
 */
function calculateScheduleTimesWithImmediateDelivery(params: ReminderScheduleParams): any[] {
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
  
  // CRITICAL FIX: If deadline has passed, create IMMEDIATE final delivery
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
    
    return scheduleEntries; // Return immediately with just the final delivery
  }
  
  // For future deadlines, create normal reminder schedule
  const totalDurationMinutes = (effectiveDeadline.getTime() - now.getTime()) / (60 * 1000);
  console.log(`[REMINDER-SERVICE] Total duration: ${totalDurationMinutes.toFixed(1)} minutes`);
  
  // Create check-in reminders
  for (const minutes of reminderMinutes) {
    const scheduledAt = new Date(effectiveDeadline.getTime() - (minutes * 60 * 1000));
    
    // Only create reminders that are in the future
    if (scheduledAt <= now) {
      console.warn(`[REMINDER-SERVICE] Reminder ${minutes} mins before deadline would be in the past, skipping`);
      continue;
    }
    
    console.log(`[REMINDER-SERVICE] Creating check-in reminder ${minutes} mins before deadline at ${scheduledAt.toISOString()}`);
    
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: scheduledAt.toISOString(),
      reminder_type: 'reminder',
      status: 'pending',
      delivery_priority: minutes < 60 ? 'high' : 'normal',
      retry_strategy: 'standard'
    });
  }
  
  // ALWAYS add final delivery at exact deadline
  console.log(`[REMINDER-SERVICE] Adding final delivery at exact deadline: ${effectiveDeadline.toISOString()}`);
  
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: effectiveDeadline.toISOString(),
    reminder_type: 'final_delivery',
    status: 'pending',
    delivery_priority: 'critical',
    retry_strategy: 'aggressive'
  });
  
  console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} total reminder entries`);
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
