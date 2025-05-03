
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get message delivery record
 */
export async function getDeliveryRecord(messageId: string, deliveryId: string) {
  const supabase = supabaseClient();
  return await supabase
    .from("delivered_messages")
    .select("*")
    .eq("delivery_id", deliveryId)
    .eq("message_id", messageId)
    .maybeSingle();
}

/**
 * Create a delivery record if it doesn't exist
 */
export async function createDeliveryRecord(messageId: string, conditionId: string, recipientId: string, deliveryId: string) {
  const supabase = supabaseClient();
  return await supabase
    .from("delivered_messages")
    .insert({
      message_id: messageId,
      condition_id: conditionId,
      recipient_id: recipientId,
      delivery_id: deliveryId,
      delivered_at: new Date().toISOString()
    });
}

/**
 * Update the delivery record to mark a message as viewed
 */
export async function recordMessageView(messageId: string, deliveryId: string, deviceInfo: string | null = null) {
  const supabase = supabaseClient();
  return await supabase
    .from("delivered_messages")
    .update({ 
      viewed_at: new Date().toISOString(),
      viewed_count: 1,
      device_info: deviceInfo
    })
    .eq("delivery_id", deliveryId)
    .eq("message_id", messageId);
}

/**
 * Verify PIN and update view status
 */
export async function verifyPinAndRecordView(messageId: string, deliveryId: string, pin: string) {
  const supabase = supabaseClient();
  
  // Get the message condition to check PIN
  const { data: condition, error: conditionError } = await supabase
    .from("message_conditions")
    .select("pin_code")
    .eq("message_id", messageId)
    .single();
    
  if (conditionError || !condition) {
    throw new Error("Message condition not found");
  }
  
  // Verify PIN
  if (condition.pin_code !== pin) {
    throw new Error("Incorrect PIN");
  }
  
  // PIN is correct, update delivery record
  const { data, error } = await recordMessageView(messageId, deliveryId);
  
  if (error) {
    console.error("Error updating delivery record:", error);
    // Continue anyway, PIN verification succeeded
  }
  
  return { success: true };
}

/**
 * Check if a delivery record exists for the given message and delivery ID
 */
export async function hasDeliveryRecord(messageId: string, deliveryId: string) {
  const { data, error } = await getDeliveryRecord(messageId, deliveryId);
  
  if (error) {
    console.error("Error checking delivery record:", error);
    return false;
  }
  
  return !!data;
}
