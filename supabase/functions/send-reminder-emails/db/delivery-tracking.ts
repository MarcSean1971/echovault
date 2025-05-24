
import { supabaseClient } from "../supabase-client.ts";

/**
 * Record a message delivery to a recipient
 */
export async function recordMessageDelivery(
  messageId: string, 
  conditionId: string, 
  recipientId: string,
  deliveryId: string
) {
  try {
    const supabase = supabaseClient();
    
    // Log the parameters for debugging
    console.log(`[recordMessageDelivery] Creating delivery record with:`, {
      messageId,
      conditionId,
      recipientId, 
      deliveryId
    });
    
    // Check if delivery record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("delivered_messages")
      .select("id")
      .filter('delivery_id', 'eq', deliveryId)
      .maybeSingle();
      
    if (checkError && checkError.code !== "42P01") {
      console.error("[recordMessageDelivery] Error checking for existing delivery record:", checkError);
    }
    
    // If record exists, don't create a duplicate
    if (existingRecord) {
      console.log(`[recordMessageDelivery] Delivery record already exists for ID ${deliveryId}`);
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
      console.error("[recordMessageDelivery] Error inserting message delivery:", error);
      console.error("[recordMessageDelivery] Error details:", JSON.stringify(error));
      
      if (error.code === "42P01") {
        console.warn("[recordMessageDelivery] delivered_messages table may not exist yet");
      }
    } else {
      console.log(`[recordMessageDelivery] Successfully created delivery record: ${deliveryId} for message ${messageId}`);
    }
    
    return data;
  } catch (error) {
    console.error("[recordMessageDelivery] Error in recordMessageDelivery:", error);
    return null; // Don't throw here, just return null to continue the process
  }
}
