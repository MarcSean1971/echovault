
import { getAuthClient } from "@/lib/supabaseClient";
import { CheckInResult, CheckInDeadlineResult } from "./types";
import { updateConditionsLastChecked } from "./dbOperations";

export async function performCheckIn(userId: string, method: string): Promise<CheckInResult> {
  const client = await getAuthClient();
  const now = new Date().toISOString();
  
  try {
    // Instead of using the check_ins table that doesn't exist yet,
    // we'll update the last_checked timestamp on all active conditions
    const { data: conditionsData, error: conditionsError } = await client
      .from("message_conditions")
      .select("id, message_id, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true);
      
    if (conditionsError) {
      throw new Error(conditionsError.message);
    }
    
    // Update all conditions with the new check-in time
    if (conditionsData && conditionsData.length > 0) {
      const conditionIds = conditionsData.map(c => c.id);
      await updateConditionsLastChecked(conditionIds, now);
    }
    
    // Log the check-in in the messages table for now (since we don't have check_ins yet)
    return {
      success: true,
      timestamp: now,
      method: method,
      conditions_updated: conditionsData?.length || 0
    };
  } catch (error: any) {
    console.error("Error performing check-in:", error);
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
        
        // For recurring message types, we need to handle differently
        // But since we don't have recurring_pattern or last_message_sent fields in the DB schema
        // We'll stick with the basic calculation for now
        
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
    
    return {
      deadline: earliestDeadline,
      conditions: data || []
    };
  } catch (error: any) {
    console.error("Error getting next check-in deadline:", error);
    throw new Error(error.message || "Failed to get next check-in deadline");
  }
}

// We're removing this function as it relies on fields that don't exist in our DB schema
// Function can be reimplemented later when needed
// export function calculateNextOccurrence(baseDate: Date, pattern: RecurringPattern): Date {
//   // Implementation removed
// }
