
import { supabase } from "@/integrations/supabase/client";

/**
 * Perform a check-in for all active conditions of a user
 */
export async function performUserCheckIn(userId: string): Promise<boolean> {
  try {
    console.log(`Performing check-in for user ${userId}`);
    
    const now = new Date().toISOString();
    
    // Get all active conditions for this user via messages they own
    const { data: conditions, error } = await supabase
      .from("message_conditions")
      .select("id, message_id, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (error) {
      console.error("Error fetching conditions:", error);
      return false;
    }
    
    if (!conditions || conditions.length === 0) {
      console.log("No active conditions found for user");
      return true; // Consider this successful since there's nothing to update
    }
    
    console.log(`Found ${conditions.length} active conditions to update`);
    
    // Update all conditions with the new check-in time
    const { error: updateError } = await supabase
      .from("message_conditions")
      .update({ last_checked: now })
      .in("id", conditions.map(c => c.id));
    
    if (updateError) {
      console.error("Error updating conditions:", updateError);
      return false;
    }
    
    console.log(`Successfully updated ${conditions.length} conditions with check-in time`);
    return true;
  } catch (error) {
    console.error("Error in performUserCheckIn:", error);
    return false;
  }
}

/**
 * Calculate the next check-in deadline for a condition
 */
export function getNextCheckInDeadline(condition: any): Date | null {
  if (!condition || !condition.last_checked) {
    return null;
  }
  
  try {
    const lastChecked = new Date(condition.last_checked);
    const hoursToAdd = condition.hours_threshold || 0;
    const minutesToAdd = condition.minutes_threshold || 0;
    
    // Calculate deadline
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + hoursToAdd);
    deadline.setMinutes(deadline.getMinutes() + minutesToAdd);
    
    return deadline;
  } catch (error) {
    console.error("Error calculating next check-in deadline:", error);
    return null;
  }
}
