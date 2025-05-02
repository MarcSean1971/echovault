
import { getAuthClient } from "@/lib/supabaseClient";
import { CheckInResult, CheckInDeadlineResult } from "./types";
import { updateConditionsLastChecked } from "./dbOperations";
import { MessageCondition, Recipient } from "@/types/message";

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
        condition_type: item.condition_type as any, // Type casting
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
