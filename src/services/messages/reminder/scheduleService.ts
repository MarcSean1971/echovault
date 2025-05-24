
/**
 * Service functions for creating and managing reminder schedules
 * FIXED: Improved temporal separation to prevent simultaneous check-in and final delivery
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * Create or update reminder schedule - uses upsert with the unique constraint
 * FIXED: Better temporal separation between reminder types
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating or updating reminder schedule for:", params);
    console.log("[REMINDER-SERVICE] Is this an edit operation?", isEdit);
    
    // Mark existing reminders as obsolete first (safety measure)
    await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    
    // Calculate scheduled times with FIXED temporal separation
    const scheduleTimes = calculateFixedScheduleTimes(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries with FIXED separation`);
    console.log(`[REMINDER-SERVICE] Entry breakdown:`, {
      checkInReminders: scheduleTimes.filter(s => s.reminder_type === 'reminder').length,
      finalDelivery: scheduleTimes.filter(s => s.reminder_type === 'final_delivery').length
    });
    
    // Create reminder entries with proper conflict handling using our unique constraint
    const { data, error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleTimes, {
        onConflict: 'message_id,condition_id,scheduled_at,reminder_type',
        ignoreDuplicates: false
      });
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.error("[REMINDER-SERVICE] Permission denied creating reminder schedule - user likely doesn't own this message");
        toast({
          title: "Permission Error",
          description: "You don't have permission to create reminders for this message.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        console.error("[REMINDER-SERVICE] Error creating reminder schedule:", error);
      }
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Successfully created ${scheduleTimes.length} reminder schedule entries with FIXED separation`);
    
    // Broadcast an update event
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        messageId: params.messageId,
        conditionId: params.conditionId,
        updatedAt: new Date().toISOString(),
        action: 'reminder-schedule-created'
      }
    }));
    
    // More reliable notification processing
    await triggerReliableNotificationProcessing(params.messageId, !isEdit);
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * FIXED: Calculate reminder schedule times with proper temporal separation
 * Ensures minimum 30-minute gap between last check-in reminder and final delivery
 */
function calculateFixedScheduleTimes(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  // For check-in conditions, we need to create a virtual deadline
  let effectiveDeadline: Date | null = null;
  const now = new Date();
  
  if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold || minutesThreshold)) {
    const lastCheckedDate = new Date(lastChecked);
    effectiveDeadline = new Date(lastCheckedDate);
    
    if (hoursThreshold) {
      effectiveDeadline.setHours(effectiveDeadline.getHours() + hoursThreshold);
    }
    
    if (minutesThreshold) {
      effectiveDeadline.setMinutes(effectiveDeadline.getMinutes() + minutesThreshold);
    }
    
    console.log(`[REMINDER-SERVICE] Calculated deadline for ${conditionType}: ${effectiveDeadline.toISOString()}`);
  } else if (triggerDate) {
    effectiveDeadline = new Date(triggerDate);
    console.log(`[REMINDER-SERVICE] Using explicit trigger date: ${effectiveDeadline.toISOString()}`);
  } else {
    console.warn("[REMINDER-SERVICE] No deadline could be determined");
    return [];
  }
  
  if (!effectiveDeadline) {
    return [];
  }
  
  // Validate deadline is in the future
  if (effectiveDeadline <= now) {
    console.warn(`[REMINDER-SERVICE] Deadline ${effectiveDeadline.toISOString()} is in the past, adjusting to minimum future time`);
    effectiveDeadline = new Date(now.getTime() + 10 * 60 * 1000);
  }
  
  // Generate schedule entries with FIXED temporal separation
  console.log(`[REMINDER-SERVICE] Generating reminders for ${reminderMinutes.length} times:`, reminderMinutes);
  console.log(`[REMINDER-SERVICE] Using deadline: ${effectiveDeadline.toISOString()}`);
  
  const scheduleEntries = [];
  const minimumFutureTime = new Date(now.getTime() + 2 * 60 * 1000);
  
  // FIXED: Create check-in reminders with proper temporal separation
  let lastCheckInReminderTime: Date | null = null;
  
  for (const minutes of reminderMinutes) {
    const scheduledAt = new Date(effectiveDeadline!.getTime() - (minutes * 60 * 1000));
    
    // Only create reminders that are in the future
    if (scheduledAt <= now) {
      console.warn(`[REMINDER-SERVICE] Reminder ${minutes} mins before deadline would be at ${scheduledAt.toISOString()} (in the past), skipping`);
      continue;
    }
    
    // Ensure minimum future time
    const adjustedScheduledAt = scheduledAt < minimumFutureTime ? minimumFutureTime : scheduledAt;
    
    // FIXED: Ensure at least 30 minutes separation from final delivery (was 5 minutes)
    const timeTillDeadline = effectiveDeadline!.getTime() - adjustedScheduledAt.getTime();
    if (timeTillDeadline < 30 * 60 * 1000) { // Less than 30 minutes before deadline
      console.warn(`[REMINDER-SERVICE] Check-in reminder too close to deadline (${timeTillDeadline / 60000} minutes), adjusting`);
      const adjustedTime = new Date(effectiveDeadline!.getTime() - 30 * 60 * 1000);
      if (adjustedTime <= now) {
        console.warn(`[REMINDER-SERVICE] Cannot create properly separated check-in reminder, skipping`);
        continue;
      }
      adjustedScheduledAt.setTime(adjustedTime.getTime());
    }
    
    console.log(`[REMINDER-SERVICE] Creating check-in reminder ${minutes} mins before deadline at ${adjustedScheduledAt.toISOString()}`);
    
    // Track the last check-in reminder time for final delivery separation
    if (!lastCheckInReminderTime || adjustedScheduledAt > lastCheckInReminderTime) {
      lastCheckInReminderTime = adjustedScheduledAt;
    }
    
    // Set reminder_type = 'reminder' for check-in reminders (sent to creator)
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: adjustedScheduledAt.toISOString(),
      reminder_type: 'reminder',
      status: 'pending',
      delivery_priority: minutes < 60 ? 'high' : 'normal',
      retry_strategy: 'standard'
    });
  }
  
  // FIXED: Add final delivery entry with STRICT temporal separation
  if (effectiveDeadline > now) {
    // FIXED: Ensure final delivery is at least 30 minutes after the last check-in reminder
    let finalDeliveryTime = new Date(effectiveDeadline);
    
    if (lastCheckInReminderTime) {
      const minFinalTime = new Date(lastCheckInReminderTime.getTime() + 30 * 60 * 1000); // 30 minutes gap
      
      if (finalDeliveryTime < minFinalTime) {
        finalDeliveryTime = minFinalTime;
        console.log(`[REMINDER-SERVICE] FIXED: Adjusted final delivery time to ensure 30-minute separation: ${finalDeliveryTime.toISOString()}`);
      }
    }
    
    // ADDITIONAL FIX: Ensure final delivery is scheduled AT the actual deadline, not before
    if (finalDeliveryTime < effectiveDeadline) {
      finalDeliveryTime = new Date(effectiveDeadline);
      console.log(`[REMINDER-SERVICE] FIXED: Final delivery scheduled exactly at deadline: ${finalDeliveryTime.toISOString()}`);
    }
    
    console.log(`[REMINDER-SERVICE] Adding final delivery at: ${finalDeliveryTime.toISOString()}`);
    
    // Set reminder_type = 'final_delivery' for final messages (sent to recipients)
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: finalDeliveryTime.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
  } else {
    console.warn(`[REMINDER-SERVICE] Final delivery deadline ${effectiveDeadline.toISOString()} is in the past, skipping`);
  }
  
  console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} reminder entries with FIXED separation`);
  console.log(`[REMINDER-SERVICE] Entry types and times:`, scheduleEntries.map(e => ({ 
    type: e.reminder_type, 
    scheduledAt: e.scheduled_at,
    minutesFromNow: Math.round((new Date(e.scheduled_at).getTime() - now.getTime()) / (1000 * 60))
  })));
  
  return scheduleEntries;
}

/**
 * More reliable notification processing with multiple retry strategies
 */
async function triggerReliableNotificationProcessing(messageId: string, shouldForceSend: boolean = false): Promise<void> {
  console.log(`[REMINDER-SERVICE] Triggering reliable notification processing for ${messageId} with forceSend=${shouldForceSend}`);
  
  const triggerMethods = [
    () => supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId: messageId,
        debug: true,
        forceSend: shouldForceSend,
        source: "reliable-trigger-primary",
        action: "process"
      }
    }),
    () => supabase.functions.invoke("send-message-notifications", {
      body: { 
        messageId: messageId,
        debug: true,
        forceSend: shouldForceSend,
        source: "reliable-trigger-backup",
        bypassDeduplication: shouldForceSend
      }
    })
  ];

  let success = false;
  let lastError: any = null;

  for (let i = 0; i < triggerMethods.length && !success; i++) {
    try {
      const { error } = await triggerMethods[i]();
      if (!error) {
        success = true;
        console.log(`[REMINDER-SERVICE] Successfully triggered notification processing (method ${i + 1})`);
      } else {
        lastError = error;
        console.warn(`[REMINDER-SERVICE] Method ${i + 1} failed:`, error);
      }
    } catch (error) {
      lastError = error;
      console.warn(`[REMINDER-SERVICE] Method ${i + 1} threw exception:`, error);
    }
  }

  if (!success) {
    console.error("[REMINDER-SERVICE] All trigger methods failed:", lastError);
    
    if (shouldForceSend) {
      toast({
        title: "Warning",
        description: "Reminder was scheduled but trigger failed. Processing may be delayed.",
        variant: "destructive",
        duration: 8000,
      });
    }
  }
}
