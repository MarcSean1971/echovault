import { supabaseClient } from "../supabase-client.ts";

/**
 * Fetch message data for a given message ID 
 */
export async function fetchMessageData(messageId: string) {
  const supabase = supabaseClient();
  
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
  
  if (error) {
    console.error(`Error fetching message data for ${messageId}:`, error);
    throw error;
  }
  
  if (!data) {
    throw new Error(`Message ${messageId} not found`);
  }
  
  return data;
}

/**
 * Fetch condition data for a given condition ID
 */
export async function fetchConditionData(conditionId: string) {
  const supabase = supabaseClient();
  
  const { data, error } = await supabase
    .from("message_conditions")
    .select("*")
    .eq("id", conditionId)
    .single();
  
  if (error) {
    console.error(`Error fetching condition data for ${conditionId}:`, error);
    throw error;
  }
  
  if (!data) {
    throw new Error(`Condition ${conditionId} not found`);
  }
  
  return data;
}

/**
 * Fetch creator profile data
 * CRITICAL FIX: Added proper error handling and type checking
 */
export async function fetchCreatorProfile(userId: string) {
  if (!userId) {
    console.error("[REMINDER-SERVICE] Missing user ID for fetching creator profile");
    return null;
  }
  
  try {
    const supabase = supabaseClient();
    
    console.log(`[REMINDER-SERVICE] Fetching profile for user ${userId}`);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error(`[REMINDER-SERVICE] Error getting creator profile:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`[REMINDER-SERVICE] Error in fetchCreatorProfile:`, error);
    return null;
  }
}

/**
 * Get creator's display name from profile data
 */
export function getCreatorName(profileData: any): string {
  if (!profileData) {
    return "User";
  }
  
  const { first_name, last_name } = profileData;
  
  if (first_name && last_name) {
    return `${first_name} ${last_name}`;
  } else if (first_name) {
    return first_name;
  } else if (last_name) {
    return last_name;
  } else {
    return "User";
  }
}

/**
 * Log delivery error to the reminder_delivery_log table
 */
export async function logDeliveryError(errorData: {
  reminder_id: string;
  message_id: string;
  condition_id: string;
  recipient: string;
  delivery_channel: string;
  channel_order: number;
  delivery_status: string;
  error_message: string;
}) {
  try {
    const supabase = supabaseClient();
    
    await supabase.from("reminder_delivery_log").insert({
      reminder_id: errorData.reminder_id,
      message_id: errorData.message_id,
      condition_id: errorData.condition_id,
      recipient: errorData.recipient,
      delivery_channel: errorData.delivery_channel,
      channel_order: errorData.channel_order,
      delivery_status: errorData.delivery_status,
      error_message: errorData.error_message
    });
  } catch (error) {
    console.error("Failed to log delivery error:", error);
  }
}

/**
 * Determine if a condition should remain active after delivery
 */
export function shouldKeepConditionActive(condition: any): boolean {
  // Keep active if it's a recurring check-in
  if (condition.condition_type === 'recurring_check_in') {
    return true;
  }
  
  // For panic triggers, check the keep_armed setting in panic_config
  if (condition.condition_type === 'panic_trigger') {
    if (condition.panic_config && typeof condition.panic_config.keep_armed !== 'undefined') {
      return condition.panic_config.keep_armed === true;
    }
    // Default to true for panic triggers if not specified
    return true;
  }
  
  // All other condition types should be deactivated
  return false;
}

/**
 * Get panic configuration for a condition
 */
export async function getPanicConfig(conditionId: string) {
  try {
    const supabase = supabaseClient();
    
    const { data, error } = await supabase
      .from("message_conditions")
      .select("panic_config")
      .eq("id", conditionId)
      .single();
    
    if (error) {
      console.error(`Error fetching panic config for condition ${conditionId}:`, error);
      return null;
    }
    
    return data.panic_config;
  } catch (error) {
    console.error(`Error in getPanicConfig:`, error);
    return null;
  }
}

/**
 * Helper function to get the auth user's details
 * CRITICAL FIX: Added to allow direct fetching of auth user email for creators
 */
export async function getAuthUserDetails(userId: string) {
  if (!userId) return null;
  
  try {
    const supabase = supabaseClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error(`Error fetching auth user ${userId}:`, error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error(`Error in getAuthUserDetails:`, error);
    return null;
  }
}
