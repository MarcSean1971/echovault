/**
 * Service for fetching message and condition data
 */
import { supabaseClient } from "../supabase-client.ts";
import { MessageData, ConditionData, ProfileData, DeliveryLogEntry } from "../types/reminder-types.ts";

/**
 * Fetch message data by ID
 */
export async function fetchMessageData(messageId: string): Promise<MessageData> {
  const { data, error } = await supabaseClient()
    .from("messages")
    .select("*, user_id")
    .eq("id", messageId)
    .single();
    
  if (error || !data) {
    console.error(`Error fetching message ${messageId}:`, error);
    throw new Error(`Message not found: ${error?.message || 'Unknown error'}`);
  }
  
  return data as MessageData;
}

/**
 * Fetch condition data by ID
 */
export async function fetchConditionData(conditionId: string): Promise<ConditionData> {
  const { data, error } = await supabaseClient()
    .from("message_conditions")
    .select("*")
    .eq("id", conditionId)
    .single();
    
  if (error || !data) {
    console.error(`Error fetching condition ${conditionId}:`, error);
    throw new Error(`Condition not found: ${error?.message || 'Unknown error'}`);
  }
  
  return data as ConditionData;
}

/**
 * Fetch profile data for a user
 */
export async function fetchCreatorProfile(userId: string): Promise<ProfileData> {
  try {
    const { data, error } = await supabaseClient()
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();
      
    return data as ProfileData || {};
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return {};
  }
}

/**
 * Get creator's name based on profile data
 */
export function getCreatorName(profileData?: ProfileData): string {
  if (!profileData) return "Message Creator";
  
  return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || "Message Creator";
}

/**
 * Log error in delivery log
 */
export async function logDeliveryError(
  data: Partial<DeliveryLogEntry>
): Promise<void> {
  try {
    const supabase = supabaseClient();
    await supabase.from('reminder_delivery_log').insert({
      reminder_id: data.reminder_id || "unknown",
      message_id: data.message_id || "unknown",
      condition_id: data.condition_id || "unknown",
      recipient: data.recipient || "system",
      delivery_channel: data.delivery_channel || "system",
      channel_order: data.channel_order || 0,
      delivery_status: data.delivery_status || 'error',
      error_message: data.error_message || 'Unknown error'
    });
  } catch (logError) {
    console.error("Failed to log delivery error:", logError);
  }
}

/**
 * Determine if condition should be kept active after delivery
 */
export function shouldKeepConditionActive(conditionData: ConditionData): boolean {
  // For recurring check-ins, always keep active
  if (conditionData.condition_type === 'recurring_check_in') {
    return true;
  }
  
  // For panic buttons, check keep_armed setting
  if (conditionData.condition_type === 'panic_trigger' && conditionData.panic_config) {
    return conditionData.panic_config.keep_armed === true;
  }
  
  return false;
}
