
import { supabaseClient } from "./supabase-client.ts";

/**
 * Ensure the delivered_messages table exists
 * This is a utility function that can be called to make sure the table is ready
 */
export async function ensureDeliveredMessagesTable() {
  try {
    const supabase = supabaseClient();
    
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from("delivered_messages")
      .select("count")
      .limit(1);
      
    if (error && error.code === "42P01") {
      console.warn("delivered_messages table doesn't exist yet. The migration may need to be run.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking for delivered_messages table:", error);
    return false;
  }
}

/**
 * Record a message delivery in the database
 */
export async function recordDelivery(
  messageId: string,
  conditionId: string,
  recipientId: string,
  deliveryId: string
) {
  try {
    const supabase = supabaseClient();
    
    // Check if delivery record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("delivered_messages")
      .select("id")
      .eq("delivery_id", deliveryId)
      .maybeSingle();
      
    if (checkError && checkError.code !== "42P01") {
      console.error("Error checking for existing delivery record:", checkError);
      throw checkError;
    }
    
    // If record exists, don't create a duplicate
    if (existingRecord) {
      console.log(`Delivery record already exists for ID ${deliveryId}`);
      return existingRecord;
    }
    
    // Insert the delivery record
    const { data, error } = await supabase
      .from("delivered_messages")
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        recipient_id: recipientId,
        delivery_id: deliveryId,
        delivered_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error("Error inserting message delivery:", error);
      throw error;
    }
    
    console.log(`Successfully created delivery record: ${deliveryId} for message ${messageId}`);
    return data;
  } catch (error) {
    console.error("Error in recordDelivery:", error);
    throw error;
  }
}

/**
 * Record a message view in the database
 */
export async function recordMessageView(
  deliveryId: string,
  deviceInfo: string | null = null
) {
  try {
    const supabase = supabaseClient();
    
    const { data, error } = await supabase
      .from("delivered_messages")
      .update({
        viewed_at: new Date().toISOString(),
        viewed_count: supabase.rpc('increment', { value: 1, default_value: 1 }),
        device_info: deviceInfo
      })
      .eq("delivery_id", deliveryId)
      .select();
    
    if (error) {
      console.error("Error recording message view:", error);
      throw error;
    }
    
    console.log(`Successfully recorded view for delivery ID ${deliveryId}`);
    return data;
  } catch (error) {
    console.error("Error in recordMessageView:", error);
    throw error;
  }
}
