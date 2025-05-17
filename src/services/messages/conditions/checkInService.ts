
import { getAuthClient } from "@/lib/supabaseClient";
import { CheckInResult, CheckInDeadlineResult } from "./types";
import { updateConditionsLastChecked } from "./dbOperations";
import { MessageCondition, Recipient, TriggerType } from "@/types/message";
import { createOrUpdateReminderSchedule } from "../reminderService";

export async function performCheckIn(userId: string, method: string): Promise<CheckInResult> {
  const client = await getAuthClient();
  const now = new Date().toISOString();
  
  try {
    // Instead of using the check_ins table that doesn't exist yet,
    // we'll update the last_checked timestamp on all active conditions
    const { data: conditionsData, error: conditionsError } = await client
      .from("message_conditions")
      .select("id, message_id, condition_type, hours_threshold, minutes_threshold, reminder_hours, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true);
      
    if (conditionsError) {
      throw new Error(conditionsError.message);
    }
    
    // Update all conditions with the new check-in time
    if (conditionsData && conditionsData.length > 0) {
      const conditionIds = conditionsData.map(c => c.id);
      // Fix: Call updateConditionsLastChecked with only the conditionIds parameter
      await updateConditionsLastChecked(conditionIds);
      
      // Also update all reminder schedules for check-in conditions
      for (const condition of conditionsData) {
        if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
          console.log(`[CHECK-IN] Generating new reminder schedule for condition ${condition.id}, message ${condition.message_id} after check-in`);
          const reminderMinutes = condition.reminder_hours || [1440, 720, 360, 180, 60]; // Default reminder times
          
          try {
            // First explicitly mark all old reminders as obsolete for this message
            // This is critical to fix the issue!
            const { createOrUpdateReminderSchedule } = await import("../reminderService");
            const { supabase } = await import("@/integrations/supabase/client");
            
            // Mark all pending reminders for this message as obsolete
            console.log(`[CHECK-IN] Explicitly marking all reminders as obsolete for message ${condition.message_id} before creating new ones`);
            const { error: obsoleteError } = await supabase
              .from('reminder_schedule')
              .update({ status: 'obsolete' })
              .eq('message_id', condition.message_id)
              .eq('status', 'pending');
            
            if (obsoleteError) {
              console.error(`[CHECK-IN] Error marking reminders as obsolete: ${obsoleteError.message}`);
            }
            
            // Make this awaited so we ensure reminders are properly updated
            await createOrUpdateReminderSchedule({
              messageId: condition.message_id,
              conditionId: condition.id,
              conditionType: condition.condition_type,
              triggerDate: null,
              reminderMinutes,
              lastChecked: now,
              hoursThreshold: condition.hours_threshold,
              minutesThreshold: condition.minutes_threshold
            });
            
            // Dispatch event to notify UI of condition update
            if (typeof window !== 'undefined') {
              console.log(`[CHECK-IN] Dispatching conditions-updated event for condition ${condition.id}, message ${condition.message_id}`);
              window.dispatchEvent(new CustomEvent('conditions-updated', { 
                detail: { 
                  conditionId: condition.id,
                  messageId: condition.message_id, 
                  type: 'check-in',
                  timestamp: Date.now() // Add unique timestamp to ensure events are distinct
                }
              }));
            }
          } catch (err) {
            console.error(`[CHECK-IN] Failed to update reminder schedule for condition ${condition.id}:`, err);
          }
        }
      }
    }
    
    return {
      success: true,
      timestamp: now,
      method: method,
      conditions_updated: conditionsData?.length || 0
    };
  } catch (error: any) {
    console.error("[CHECK-IN] Error performing check-in:", error);
    throw new Error(error.message || "Failed to perform check-in");
  }
}

export async function getNextCheckInDeadline(userId: string): Promise<CheckInDeadlineResult> {
  const client = await getAuthClient();
  
  try {
    // Get all active conditions that are check-in based
    const { data, error } = await client
      .from("message_conditions")
      .select("*, messages!inner(*)")
      .eq("messages.user_id", userId)
      .eq("active", true)
      .order("hours_threshold", { ascending: true });
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Calculate the next deadline for each condition
    const now = new Date();
    let earliestDeadline: Date | null = null;
    
    if (data && data.length > 0) {
      data.forEach(condition => {
        // Convert last_checked to a Date
        const lastChecked = new Date(condition.last_checked);
        
        // Add hours_threshold to get the deadline
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + condition.hours_threshold);
        
        // If this is earlier than our current earliest, update it
        if (!earliestDeadline || deadline < earliestDeadline) {
          earliestDeadline = deadline;
        }
      });
    }
    
    // If no conditions found, default to 24 hours from now
    if (!earliestDeadline) {
      earliestDeadline = new Date();
      earliestDeadline.setHours(earliestDeadline.getHours() + 24);
    }
    
    // Convert raw data to MessageCondition[] type with proper handling of recipients
    const conditions: MessageCondition[] = data ? data.map(item => {
      // Ensure recipients is properly cast to Recipient[]
      let recipientsArray: Recipient[] = [];
      if (Array.isArray(item.recipients)) {
        recipientsArray = item.recipients as Recipient[];
      } else if (item.recipients && typeof item.recipients === 'object') {
        recipientsArray = [item.recipients as unknown as Recipient];
      }
      
      return {
        id: item.id,
        message_id: item.message_id,
        condition_type: item.condition_type as TriggerType, // Type casting
        hours_threshold: item.hours_threshold,
        created_at: item.created_at,
        updated_at: item.updated_at,
        last_checked: item.last_checked,
        recipients: recipientsArray,
        active: item.active,
        triggered: false,
        delivered: false
      };
    }) : [];
    
    return {
      deadline: earliestDeadline,
      conditions: conditions
    };
  } catch (error: any) {
    console.error("Error getting next check-in deadline:", error);
    throw new Error(error.message || "Failed to get next check-in deadline");
  }
}
