
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get message by ID
 */
export async function getMessage(messageId: string) {
  const supabase = supabaseClient();
  return await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
}

/**
 * Get message condition by message ID
 */
export async function getMessageCondition(messageId: string) {
  const supabase = supabaseClient();
  return await supabase
    .from("message_conditions")
    .select("*")
    .eq("message_id", messageId)
    .single();
}

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
