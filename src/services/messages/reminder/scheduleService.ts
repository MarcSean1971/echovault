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
    // CRITICAL FIX: Pass the isEdit flag to markRemindersAsObsolete
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
    
    // CRITICAL FIX: Trigger immediate notification processing for new reminders 
    // This ensures that reminders created close to their scheduled time are sent immediately
    triggerNotificationProcessing(params.messageId, !isEdit); // Force send for new reminders, not for edits
    
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
    
    // CRITICAL FIX: Set reminders that are already due to "processing" status 
    // so they'll be picked up immediately by the reminder processor
    const now = new Date();
    const status = scheduledAt <= now ? 'processing' : 'pending';
    
    return {
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: scheduledAt.toISOString(),
      reminder_type: 'reminder',
      status: status,
      delivery_priority: minutes < 60 ? 'high' : 'normal', // High priority for reminders less than an hour before deadline
      retry_strategy: 'standard'
    };
  });
  
  // Add final delivery entry
  const now = new Date();
  const finalStatus = effectiveDeadline <= now ? 'processing' : 'pending';
  
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: effectiveDeadline.toISOString(),
    reminder_type: 'final_delivery',
    status: finalStatus,
    delivery_priority: 'critical',
    retry_strategy: 'aggressive'
  });
  
  return scheduleEntries;
}

/**
 * Trigger notification processing through cascading function calls
 * with built-in retry strategy for reliability
 * CRITICAL FIX: Improved parameter handling for more reliable notification processing
 */
async function triggerNotificationProcessing(messageId: string, shouldForceSend: boolean = false): Promise<void> {
  // Log whether we're forcing send or not
  console.log(`[REMINDER-SERVICE] Triggering notification processing for ${messageId} with forceSend=${shouldForceSend}`);
  
  try {
    const { error: triggerError } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId: messageId,
        debug: true,
        forceSend: shouldForceSend,
        source: shouldForceSend ? "reminder-schedule-direct-trigger" : "reminder-schedule-update",
        action: "process" // CRITICAL FIX: Add explicit action to process
      }
    });
    
    if (triggerError) {
      console.warn("[REMINDER-SERVICE] Error triggering notification processing:", triggerError);
    } else {
      console.log(`[REMINDER-SERVICE] Successfully triggered notification processing (forceSend=${shouldForceSend})`);
      
      // If successful, also call the second function as a backup
      try {
        console.log("[REMINDER-SERVICE] Also triggering message notifications function");
        await supabase.functions.invoke("send-message-notifications", {
          body: { 
            messageId: messageId,
            debug: true,
            forceSend: shouldForceSend,
            bypassDeduplication: shouldForceSend, // CRITICAL FIX: Bypass deduplication when forcing send
            source: shouldForceSend ? "reminder-schedule-backup-trigger" : "reminder-schedule-backup-update"
          }
        });
      } catch (backupError) {
        console.warn("[REMINDER-SERVICE] Error in backup notification trigger:", backupError);
      }
    }
  } catch (triggerError) {
    console.warn("[REMINDER-SERVICE] Exception triggering notification processing:", triggerError);
    
    // Second attempt after 2 seconds if first fails
    setTimeout(async () => {
      try {
        console.log(`[REMINDER-SERVICE] Retry #1: Triggering notification processing (forceSend=${shouldForceSend})`);
        await supabase.functions.invoke("send-reminder-emails", {
          body: { 
            messageId: messageId,
            debug: true,
            forceSend: shouldForceSend,
            source: shouldForceSend ? "retry-trigger-1" : "retry-update-1",
            action: "process" // CRITICAL FIX: Add explicit action to process
          }
        });
      } catch (retryError) {
        console.warn("[REMINDER-SERVICE] Retry #1 failed:", retryError);
        
        // Third attempt after 5 more seconds (7s total)
        setTimeout(async () => {
          try {
            console.log(`[REMINDER-SERVICE] Retry #2: Final attempt at triggering notification (forceSend=${shouldForceSend})`);
            await supabase.functions.invoke("send-reminder-emails", {
              body: { 
                messageId: messageId,
                debug: true,
                forceSend: shouldForceSend,
                source: shouldForceSend ? "retry-trigger-2" : "retry-update-2",
                action: "process" // CRITICAL FIX: Add explicit action to process
              }
            });
          } catch (finalError) {
            console.error("[REMINDER-SERVICE] All trigger attempts failed:", finalError);
            
            // Show UI notification about trigger failure only if we were trying to force send
            if (shouldForceSend) {
              toast({
                title: "Warning",
                description: "Reminder was scheduled but email trigger failed. Emails may be delayed.",
                variant: "destructive",
                duration: 10000
              });
            }
          }
        }, 5000);
      }
    }, 2000);
  }
}
