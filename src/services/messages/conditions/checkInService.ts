
import { supabase } from "@/integrations/supabase/client";
import { updateConditionsLastChecked } from "./operations/update-operations";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

/**
 * Perform a check-in for a user - updates all active conditions
 * CRITICAL FIX: Never modify the active field, only reset timers
 */
export async function performUserCheckIn(userId: string): Promise<boolean> {
  try {
    console.log(`[CHECK-IN-SERVICE] Starting check-in for user: ${userId}`);
    
    // CRITICAL FIX: Only get active conditions, do NOT modify active field
    const { data: conditions, error: fetchError } = await supabase
      .from("message_conditions")
      .select("id, message_id, condition_type, hours_threshold, minutes_threshold, reminder_hours")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (fetchError) {
      console.error("[CHECK-IN-SERVICE] Error fetching conditions:", fetchError);
      throw fetchError;
    }
    
    if (!conditions || conditions.length === 0) {
      console.log("[CHECK-IN-SERVICE] No active check-in conditions found for user");
      return true;
    }
    
    console.log(`[CHECK-IN-SERVICE] Found ${conditions.length} active check-in conditions`);
    console.log(`[CHECK-IN-SERVICE] CRITICAL: Will only update last_checked, NOT touching active field`);
    
    // CRITICAL FIX: Only update last_checked timestamp, never modify active field
    const conditionIds = conditions.map(c => c.id);
    const updatedConditions = await updateConditionsLastChecked(conditionIds);
    
    if (!updatedConditions) {
      throw new Error("Failed to update condition timestamps");
    }
    
    console.log("[CHECK-IN-SERVICE] CONFIRMED: Successfully updated ONLY last_checked timestamps");
    
    // Regenerate reminder schedules
    console.log("[CHECK-IN-SERVICE] Marking existing reminders as obsolete and regenerating schedules");
    
    for (const condition of conditions) {
      try {
        console.log(`[CHECK-IN-SERVICE] Processing condition ${condition.id}, message ${condition.message_id}`);
        
        // Mark existing reminders as obsolete
        const { error: obsoleteError } = await supabase
          .from('reminder_schedule')
          .update({ status: 'obsolete' })
          .eq('message_id', condition.message_id)
          .eq('condition_id', condition.id)
          .eq('status', 'pending');
        
        if (obsoleteError) {
          console.error(`[CHECK-IN-SERVICE] Error marking reminders obsolete for condition ${condition.id}:`, obsoleteError);
        } else {
          console.log(`[CHECK-IN-SERVICE] Marked existing reminders as obsolete for condition ${condition.id}`);
        }
        
        // Only regenerate reminders if the condition has reminder_hours configured
        if (condition.reminder_hours && condition.reminder_hours.length > 0) {
          console.log(`[CHECK-IN-SERVICE] Regenerating reminders for condition ${condition.id} with ${condition.reminder_hours.length} reminder times`);
          
          // Calculate new deadline based on updated last_checked
          const now = new Date();
          const newDeadline = new Date(now);
          newDeadline.setHours(newDeadline.getHours() + (condition.hours_threshold || 0));
          newDeadline.setMinutes(newDeadline.getMinutes() + (condition.minutes_threshold || 0));
          
          console.log(`[CHECK-IN-SERVICE] New deadline for condition ${condition.id}: ${newDeadline.toISOString()}`);
          
          // Create new reminder schedule entries
          const reminderEntries = condition.reminder_hours.map((minutes: number) => {
            const scheduledAt = new Date(newDeadline.getTime() - (minutes * 60 * 1000));
            
            return {
              message_id: condition.message_id,
              condition_id: condition.id,
              scheduled_at: scheduledAt.toISOString(),
              reminder_type: 'reminder',
              status: 'pending',
              delivery_priority: minutes < 60 ? 'high' : 'normal',
              retry_strategy: 'standard'
            };
          });
          
          // Add final delivery entry
          reminderEntries.push({
            message_id: condition.message_id,
            condition_id: condition.id,
            scheduled_at: newDeadline.toISOString(),
            reminder_type: 'final_delivery',
            status: 'pending',
            delivery_priority: 'critical',
            retry_strategy: 'aggressive'
          });
          
          // Insert new reminder schedule
          const { error: insertError } = await supabase
            .from('reminder_schedule')
            .insert(reminderEntries);
          
          if (insertError) {
            console.error(`[CHECK-IN-SERVICE] Error creating new reminder schedule for condition ${condition.id}:`, insertError);
          } else {
            console.log(`[CHECK-IN-SERVICE] Successfully created ${reminderEntries.length} new reminder entries for condition ${condition.id}`);
          }
        } else {
          console.log(`[CHECK-IN-SERVICE] No reminder_hours configured for condition ${condition.id}, skipping reminder generation`);
        }
        
      } catch (reminderError) {
        console.error(`[CHECK-IN-SERVICE] Error processing reminders for condition ${condition.id}:`, reminderError);
        // Don't fail the entire check-in if reminder processing fails
      }
    }
    
    // Trigger immediate processing of any due reminders
    try {
      console.log("[CHECK-IN-SERVICE] Triggering immediate reminder processing");
      
      const { error: triggerError } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          forceSend: false,
          source: "check-in-service-trigger",
          action: "process"
        }
      });
      
      if (triggerError) {
        console.error("[CHECK-IN-SERVICE] Error triggering reminder processing:", triggerError);
      } else {
        console.log("[CHECK-IN-SERVICE] Successfully triggered reminder processing");
      }
    } catch (triggerError) {
      console.error("[CHECK-IN-SERVICE] Exception triggering reminder processing:", triggerError);
    }
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        updatedAt: new Date().toISOString(),
        source: 'check-in-service',
        userId,
        conditionsUpdated: conditions.length,
        action: 'check-in-completed',
        criticalNote: 'Conditions remain ACTIVE, only timers reset'
      }
    }));
    
    console.log(`[CHECK-IN-SERVICE] FINAL STATUS: Check-in completed successfully, ${conditions.length} conditions remain ACTIVE with reset timers`);
    return true;
    
  } catch (error) {
    console.error("[CHECK-IN-SERVICE] Error performing user check-in:", error);
    throw error;
  }
}

/**
 * Calculate the next check-in deadline for a condition
 */
export function getNextCheckInDeadline(condition: any): Date | null {
  if (!condition.last_checked) {
    return null;
  }
  
  const lastChecked = new Date(condition.last_checked);
  const deadline = new Date(lastChecked);
  
  if (condition.hours_threshold) {
    deadline.setHours(deadline.getHours() + condition.hours_threshold);
  }
  
  if (condition.minutes_threshold) {
    deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
  }
  
  return deadline;
}
