
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageStatusResult } from "./types";

/**
 * Arms a message by setting its condition to active
 * @param conditionId ID of the condition to arm
 */
export async function armMessage(conditionId: string): Promise<MessageStatusResult> {
  const client = await getAuthClient();
  
  try {
    const { data, error } = await client
      .from("message_conditions")
      .update({ 
        active: true,
        last_checked: new Date().toISOString() 
      })
      .eq("id", conditionId)
      .select("id, message_id, active, condition_type")
      .single();
      
    if (error) {
      console.error("Error arming message:", error);
      throw new Error("Failed to arm message");
    }
    
    return {
      id: data.id,
      message_id: data.message_id,
      status: "armed",
      active: data.active,
      condition_type: data.condition_type
    };
  } catch (error: any) {
    console.error("Error in armMessage:", error);
    throw error;
  }
}

/**
 * Disarms a message by setting its condition to inactive
 * @param conditionId ID of the condition to disarm
 */
export async function disarmMessage(conditionId: string): Promise<MessageStatusResult> {
  const client = await getAuthClient();
  
  try {
    const { data, error } = await client
      .from("message_conditions")
      .update({ active: false })
      .eq("id", conditionId)
      .select("id, message_id, active, condition_type")
      .single();
      
    if (error) {
      console.error("Error disarming message:", error);
      throw new Error("Failed to disarm message");
    }
    
    return {
      id: data.id,
      message_id: data.message_id,
      status: "disarmed",
      active: data.active,
      condition_type: data.condition_type
    };
  } catch (error: any) {
    console.error("Error in disarmMessage:", error);
    throw error;
  }
}

/**
 * Gets the next deadline for a message based on condition type and settings
 * @param conditionId ID of the condition to get deadline for
 */
export async function getMessageDeadline(conditionId: string): Promise<Date | null> {
  const client = await getAuthClient();
  
  try {
    const { data, error } = await client
      .from("message_conditions")
      .select("*")
      .eq("id", conditionId)
      .single();
      
    if (error) {
      console.error("Error getting message deadline:", error);
      throw new Error("Failed to get message deadline");
    }
    
    if (!data.active) {
      return null; // No deadline for inactive messages
    }
    
    // Calculate deadline based on condition type
    const lastChecked = data.last_checked ? new Date(data.last_checked) : new Date();
    
    switch(data.condition_type) {
      case "no_check_in":
      case "regular_check_in":
        // Add hours threshold to last checked date
        const hoursInMs = data.hours_threshold * 60 * 60 * 1000;
        // Check if minutes_threshold exists
        const minutesThreshold = data.minutes_threshold || 0;
        const minutesInMs = minutesThreshold * 60 * 1000;
        return new Date(lastChecked.getTime() + hoursInMs + minutesInMs);
        
      case "scheduled":
      case "inactivity_to_date":
        // Return the scheduled date if it exists
        return data.trigger_date ? new Date(data.trigger_date) : null;
        
      default:
        return null;
    }
  } catch (error: any) {
    console.error("Error in getMessageDeadline:", error);
    throw error;
  }
}
