
import { supabase } from "@/integrations/supabase/client";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

/**
 * Perform a check-in for a condition
 * This resets the countdown timer for no_check_in conditions
 */
export async function performCheckIn(conditionId: string): Promise<boolean> {
  try {
    console.log(`[CHECK-IN] Performing check-in for condition ${conditionId}`);
    const now = new Date().toISOString();
    
    // Update the last_checked timestamp
    const { error } = await supabase
      .from("message_conditions")
      .update({ 
        last_checked: now
      })
      .eq("id", conditionId);
      
    if (error) {
      console.error("[CHECK-IN] Error performing check-in:", error);
      return false;
    }
    
    console.log("[CHECK-IN] Check-in successful, regenerating reminder schedule");
    
    // After successful check-in, update the reminder schedule
    // This is crucial for no_check_in conditions where the deadline shifts
    await ensureReminderSchedule(conditionId);
    
    // Dispatch a custom event to notify components about the condition update
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        conditionId,
        updatedAt: now,
        action: 'check-in'
      }
    }));
    
    return true;
  } catch (error) {
    console.error("[CHECK-IN] Error in performCheckIn:", error);
    return false;
  }
}

/**
 * Perform check-in for ALL of a user's active conditions
 * This is called from the check-in button in the UI
 */
export async function performUserCheckIn(userId: string): Promise<boolean> {
  try {
    console.log(`[CHECK-IN] Performing user check-in for user ${userId}`);
    const now = new Date().toISOString();
    
    // Fetch all active check-in type conditions for the user
    const { data: conditions, error: fetchError } = await supabase
      .from("message_conditions")
      .select("id, message_id, condition_type")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"])
      .order("id");
      
    if (fetchError) {
      console.error("[CHECK-IN] Error fetching user conditions:", fetchError);
      return false;
    }
    
    console.log(`[CHECK-IN] Found ${conditions?.length || 0} active conditions to update`);
    
    if (!conditions || conditions.length === 0) {
      console.log("[CHECK-IN] No active conditions found for user");
      return true; // No error, just no conditions to update
    }
    
    // Update all conditions in a batch
    const { error: updateError } = await supabase
      .from("message_conditions")
      .update({ 
        last_checked: now
      })
      .in("id", conditions.map(condition => condition.id));
      
    if (updateError) {
      console.error("[CHECK-IN] Error updating conditions:", updateError);
      return false;
    }
    
    console.log(`[CHECK-IN] Successfully updated ${conditions.length} conditions`);
    
    // Regenerate reminder schedules for all updated conditions
    for (const condition of conditions) {
      console.log(`[CHECK-IN] Regenerating reminder schedule for condition ${condition.id}`);
      await ensureReminderSchedule(condition.id);
    }
    
    // Dispatch a single event to notify components about the update
    // This will trigger UI refreshes
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        updatedAt: now,
        triggerValue: Date.now(), // Add unique timestamp to ensure events are distinct
        source: 'user-check-in',
        userId: userId
      }
    }));
    
    return true;
  } catch (error) {
    console.error("[CHECK-IN] Error in performUserCheckIn:", error);
    return false;
  }
}

/**
 * Get the next check-in deadline for a condition
 */
export function getNextCheckInDeadline(condition: any): Date | null {
  if (!condition || !condition.last_checked) return null;
  
  // Convert the condition's last_checked to a Date
  const lastChecked = new Date(condition.last_checked);
  
  // For no_check_in conditions, we add the hours threshold to last_checked
  if (condition.condition_type === "no_check_in" || 
      condition.condition_type === "recurring_check_in" || 
      condition.condition_type === "inactivity_to_date") {
    
    // Calculate hours and minutes to add
    const hoursToAdd = condition.hours_threshold || 0;
    const minutesToAdd = condition.minutes_threshold || 0;
    
    // Create a deadline by adding hours and minutes to last checked
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + hoursToAdd);
    deadline.setMinutes(deadline.getMinutes() + minutesToAdd);
    
    return deadline;
  }
  
  return null;
}
