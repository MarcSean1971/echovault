
/**
 * Service functions for creating and managing reminder schedules
 * FIXED: Only create check-in reminders initially, final delivery created dynamically when needed
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * Create or update reminder schedule - uses upsert with the unique constraint
 * FIXED: Only creates check-in reminders, no automatic final delivery scheduling
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating or updating reminder schedule for:", params);
    console.log("[REMINDER-SERVICE] Is this an edit operation?", isEdit);
    
    // Mark existing reminders as obsolete first (safety measure)
    await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    
    // Calculate scheduled times with FIXED logic - ONLY check-in reminders
    const scheduleTimes = calculateCheckInReminderTimes(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} CHECK-IN REMINDER entries only`);
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
    
    console.log(`[REMINDER-SERVICE] Successfully created ${scheduleTimes.length} CHECK-IN reminder schedule entries only`);
    
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
 * FIXED: Calculate ONLY check-in reminder schedule times - NO automatic final delivery
 */
function calculateCheckInReminderTimes(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  // For check-in conditions, we need to create a virtual deadline
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
  
  // Calculate total duration for adaptive separation
  const totalDurationMinutes = (effectiveDeadline.getTime() - now.getTime()) / (60 * 1000);
  console.log(`[REMINDER-SERVICE] Total duration: ${totalDurationMinutes.toFixed(1)} minutes`);
  
  // Adaptive minimum separation based on total duration
  let minSeparationMinutes: number;
  if (totalDurationMinutes <= 60) {
    minSeparationMinutes = 5; // 5 minutes for conditions <= 1 hour
  } else if (totalDurationMinutes <= 240) {
    minSeparationMinutes = 15; // 15 minutes for conditions <= 4 hours
  } else {
    minSeparationMinutes = 30; // 30 minutes for longer conditions
  }
  
  console.log(`[REMINDER-SERVICE] Using adaptive minimum separation: ${minSeparationMinutes} minutes`);
  
  // Generate ONLY check-in reminder entries - NO automatic final delivery
  console.log(`[REMINDER-SERVICE] Generating CHECK-IN reminders ONLY for ${reminderMinutes.length} times:`, reminderMinutes);
  console.log(`[REMINDER-SERVICE] Using deadline: ${effectiveDeadline.toISOString()}`);
  
  const scheduleEntries = [];
  const minimumFutureTime = new Date(now.getTime() + 2 * 60 * 1000);
  
  // Create check-in reminders with proper separation
  for (const minutes of reminderMinutes) {
    const scheduledAt = new Date(effectiveDeadline!.getTime() - (minutes * 60 * 1000));
    
    // Only create reminders that are in the future
    if (scheduledAt <= now) {
      console.warn(`[REMINDER-SERVICE] Reminder ${minutes} mins before deadline would be at ${scheduledAt.toISOString()} (in the past), skipping`);
      continue;
    }
    
    // Ensure minimum future time
    const adjustedScheduledAt = scheduledAt < minimumFutureTime ? minimumFutureTime : scheduledAt;
    
    // FIXED: Ensure check-in reminders are properly separated from deadline
    const timeTillDeadline = effectiveDeadline!.getTime() - adjustedScheduledAt.getTime();
    const timeTillDeadlineMinutes = timeTillDeadline / (60 * 1000);
    
    if (timeTillDeadlineMinutes < minSeparationMinutes) {
      console.warn(`[REMINDER-SERVICE] Check-in reminder too close to deadline (${timeTillDeadlineMinutes.toFixed(1)} minutes < ${minSeparationMinutes} minutes minimum), adjusting`);
      const adjustedTime = new Date(effectiveDeadline!.getTime() - (minSeparationMinutes * 60 * 1000));
      if (adjustedTime <= now) {
        console.warn(`[REMINDER-SERVICE] Cannot create properly separated check-in reminder, skipping`);
        continue;
      }
      adjustedScheduledAt.setTime(adjustedTime.getTime());
      console.log(`[REMINDER-SERVICE] Adjusted reminder time to: ${adjustedScheduledAt.toISOString()}`);
    }
    
    console.log(`[REMINDER-SERVICE] Creating check-in reminder ${minutes} mins before deadline at ${adjustedScheduledAt.toISOString()}`);
    
    // CRITICAL FIX: ONLY create check-in reminders (reminder_type = 'reminder')
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: adjustedScheduledAt.toISOString(),
      reminder_type: 'reminder', // ONLY check-in reminders
      status: 'pending',
      delivery_priority: minutes < 60 ? 'high' : 'normal',
      retry_strategy: 'standard'
    });
  }
  
  console.log(`[REMINDER-SERVICE] Created ${scheduleEntries.length} CHECK-IN reminders ONLY`);
  
  // CRITICAL FIX: DO NOT create automatic final delivery reminders
  // Final delivery will be created dynamically by the reminder processor when deadline is missed
  console.log(`[REMINDER-SERVICE] FIXED: No automatic final delivery created - will be handled dynamically by processor`);
  
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
