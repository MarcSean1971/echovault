
import { supabase } from "@/integrations/supabase/client";
import { updateConditionsLastChecked } from "./operations/update-operations";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

/**
 * Perform a check-in for a user - updates all active conditions
 * FIXED: Now properly regenerates reminder schedules after check-in
 */
export async function performUserCheckIn(userId: string): Promise<boolean> {
  try {
    console.log(`[CHECK-IN-SERVICE] Starting check-in for user: ${userId}`);
    
    // Get all active conditions for this user
    const { data: conditions, error: fetchError } = await supabase
      .from("message_conditions")
      .select("id, message_id, condition_type, hours_threshold, minutes_threshold")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (fetchError) {
      console.error("[CHECK-IN-SERVICE] Error fetching conditions:", fetchError);
      throw fetchError;
    }
    
    if (!conditions || conditions.length === 0) {
      console.log("[CHECK-IN-SERVICE] No active check-in conditions found for user");
      return true; // Not an error, just no conditions to update
    }
    
    console.log(`[CHECK-IN-SERVICE] Found ${conditions.length} active check-in conditions`);
    
    // Update last_checked timestamp for all conditions
    const conditionIds = conditions.map(c => c.id);
    const updatedConditions = await updateConditionsLastChecked(conditionIds);
    
    if (!updatedConditions) {
      throw new Error("Failed to update condition timestamps");
    }
    
    console.log("[CHECK-IN-SERVICE] Successfully updated last_checked timestamps");
    
    // CRITICAL FIX: Regenerate reminder schedules for each condition
    console.log("[CHECK-IN-SERVICE] Regenerating reminder schedules after check-in");
    
    for (const condition of conditions) {
      try {
        console.log(`[CHECK-IN-SERVICE] Regenerating reminders for condition ${condition.id}, message ${condition.message_id}`);
        
        // Use ensureReminderSchedule to regenerate the schedule
        const result = await ensureReminderSchedule(condition.id, false); // false = not an edit, it's a check-in
        
        if (result) {
          console.log(`[CHECK-IN-SERVICE] Successfully regenerated reminders for condition ${condition.id}`);
        } else {
          console.warn(`[CHECK-IN-SERVICE] Failed to regenerate reminders for condition ${condition.id}`);
        }
      } catch (reminderError) {
        console.error(`[CHECK-IN-SERVICE] Error regenerating reminders for condition ${condition.id}:`, reminderError);
        // Don't fail the entire check-in if reminder regeneration fails
      }
    }
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        updatedAt: new Date().toISOString(),
        source: 'check-in-service',
        userId,
        conditionsUpdated: conditions.length,
        action: 'check-in-completed'
      }
    }));
    
    console.log("[CHECK-IN-SERVICE] Check-in completed successfully");
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
