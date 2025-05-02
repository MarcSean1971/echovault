
import { getAuthClient } from "@/lib/supabaseClient";
import { CheckInResult, CheckInDeadlineResult } from "./types";
import { updateConditionsLastChecked } from "./dbOperations";
import { mapDbConditionToMessageCondition } from "./dbOperations";
import { RecurringPattern } from "@/types/message";

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
      .in("condition_type", [
        "no_check_in", 
        "regular_check_in", 
        "regular_check_in_recurring", 
        "inactivity_to_recurring", 
        "inactivity_to_date"
      ])
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
        
        // For regular_check_in_recurring, we need to check if we're in a recurring phase
        if (condition.condition_type === 'regular_check_in_recurring' && condition.recurring_pattern && condition.last_message_sent) {
          const lastMessageSent = new Date(condition.last_message_sent);
          const recurringPattern = condition.recurring_pattern as RecurringPattern;
          const nextMessageDate = calculateNextOccurrence(lastMessageSent, recurringPattern);
          
          if (!earliestDeadline || nextMessageDate < earliestDeadline) {
            earliestDeadline = nextMessageDate;
          }
          return;
        }
        
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
      conditions: data ? data.map(mapDbConditionToMessageCondition) : []
    };
  } catch (error: any) {
    console.error("Error getting next check-in deadline:", error);
    throw new Error(error.message || "Failed to get next check-in deadline");
  }
}

// Helper function to calculate the next occurrence based on a recurring pattern
export function calculateNextOccurrence(baseDate: Date, pattern: RecurringPattern): Date {
  const result = new Date(baseDate);
  
  switch (pattern.type) {
    case 'daily':
      result.setDate(result.getDate() + pattern.interval);
      break;
      
    case 'weekly':
      result.setDate(result.getDate() + (pattern.interval * 7));
      
      // If day of week is specified, adjust to that day
      if (pattern.day !== undefined) {
        // Adjust to the specified day (0 = Sunday, 6 = Saturday)
        const currentDayOfWeek = result.getDay();
        const daysToAdd = (pattern.day - currentDayOfWeek + 7) % 7;
        result.setDate(result.getDate() + daysToAdd);
      }
      break;
      
    case 'monthly':
      result.setMonth(result.getMonth() + pattern.interval);
      
      // If day is specified, set to that day of month
      if (pattern.day !== undefined) {
        result.setDate(Math.min(pattern.day, getDaysInMonth(result.getFullYear(), result.getMonth())));
      }
      break;
      
    case 'yearly':
      result.setFullYear(result.getFullYear() + pattern.interval);
      
      // If month is specified, set to that month
      if (pattern.month !== undefined) {
        result.setMonth(pattern.month);
      }
      
      // If day is specified, set to that day
      if (pattern.day !== undefined) {
        result.setDate(Math.min(pattern.day, getDaysInMonth(result.getFullYear(), result.getMonth())));
      }
      break;
  }
  
  // If startTime is specified, parse and set the time
  if (pattern.startTime) {
    const [hours, minutes] = pattern.startTime.split(':').map(Number);
    result.setHours(hours || 0);
    result.setMinutes(minutes || 0);
    result.setSeconds(0);
    result.setMilliseconds(0);
  }
  
  return result;
}

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
