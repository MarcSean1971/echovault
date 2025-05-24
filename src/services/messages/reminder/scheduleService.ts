/**
 * Service functions for creating and managing reminder schedules
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { markRemindersAsObsolete } from "./utils";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * Create or update reminder schedule - uses upsert with the unique constraint
 * Updated to properly handle RLS security constraints
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating or updating reminder schedule for:", params);
    console.log("[REMINDER-SERVICE] Is this an edit operation?", isEdit);
    
    // Mark existing reminders as obsolete first (safety measure)
    await markRemindersAsObsolete(params.messageId, params.conditionId, isEdit);
    
    // Calculate scheduled times
    const scheduleTimes = calculateScheduleTimes(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries`);
    
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
    
    console.log(`[REMINDER-SERVICE] Successfully created ${scheduleTimes.length} reminder schedule entries`);
    
    // Broadcast an update event
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        messageId: params.messageId,
        conditionId: params.conditionId,
        updatedAt: new Date().toISOString(),
        action: 'reminder-schedule-created'
      }
    }));
    
    // CRITICAL FIX: More reliable notification processing
    await triggerReliableNotificationProcessing(params.messageId, !isEdit);
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * Calculate reminder schedule times based on params
 */
function calculateScheduleTimes(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  // For check-in conditions, we need to create a virtual deadline
  let effectiveDeadline: Date | null = null;
  if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold || minutesThreshold)) {
    const lastCheckedDate = new Date(lastChecked);
    effectiveDeadline = new Date(lastCheckedDate);
    
    if (hoursThreshold) {
      effectiveDeadline.setHours(effectiveDeadline.getHours() + hoursThreshold);
    }
    
    if (minutesThreshold) {
      effectiveDeadline.setMinutes(effectiveDeadline.getMinutes() + minutesThreshold);
    }
    
    console.log(`[REMINDER-SERVICE] Calculated virtual deadline for ${conditionType}: ${effectiveDeadline.toISOString()}`);
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
  
  // Generate schedule entries, ensuring reminder times are correct
  console.log(`[REMINDER-SERVICE] Generating reminders for ${reminderMinutes.length} times:`, reminderMinutes);
  console.log(`[REMINDER-SERVICE] Using deadline: ${effectiveDeadline.toISOString()}`);
  
  const scheduleEntries = reminderMinutes.map(minutes => {
    const scheduledAt = new Date(effectiveDeadline!.getTime() - (minutes * 60 * 1000));
    console.log(`[REMINDER-SERVICE] Creating reminder ${minutes} mins before deadline at ${scheduledAt.toISOString()}`);
    
    // CRITICAL FIX: Set reminders that are already due to "pending" status 
    // Let the processor handle immediate processing
    const now = new Date();
    const status = 'pending';
    
    return {
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: scheduledAt.toISOString(),
      reminder_type: 'reminder',
      status: status,
      delivery_priority: minutes < 60 ? 'high' : 'normal',
      retry_strategy: 'standard'
    };
  });
  
  // Add final delivery entry
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: effectiveDeadline.toISOString(),
    reminder_type: 'final_delivery',
    status: 'pending',
    delivery_priority: 'critical',
    retry_strategy: 'aggressive'
  });
  
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
