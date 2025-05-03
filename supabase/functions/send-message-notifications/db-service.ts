
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get messages that need notifications to be sent
 */
export async function getMessagesToNotify(messageId?: string) {
  try {
    const supabase = supabaseClient();
    
    // Query to get message conditions that are active
    let query = supabase
      .from("message_conditions")
      .select(`
        id, 
        message_id, 
        condition_type, 
        recipients,
        pin_code,
        unlock_delay_hours,
        expiry_hours,
        panic_config
      `)
      .eq("active", true);
    
    // If specific message ID provided, only get that one
    if (messageId) {
      query = query.eq("message_id", messageId);
    }
    
    const { data: conditions, error } = await query;
    
    if (error) {
      console.error("Error fetching message conditions:", error);
      throw error;
    }
    
    if (!conditions || conditions.length === 0) {
      return [];
    }
    
    // Get all the message data for these conditions
    const messageIds = conditions.map(c => c.message_id);
    
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .in("id", messageIds);
    
    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      throw messagesError;
    }
    
    if (!messages || messages.length === 0) {
      return [];
    }
    
    // Map messages to conditions
    return conditions.map(condition => {
      const message = messages.find(m => m.id === condition.message_id);
      return {
        condition,
        message
      };
    }).filter(item => !!item.message); // Only include items where the message was found
  } catch (error) {
    console.error("Error in getMessagesToNotify:", error);
    throw error;
  }
}

/**
 * Track message notification in the database
 */
export async function trackMessageNotification(messageId: string, conditionId: string) {
  try {
    const supabase = supabaseClient();
    
    // We can't set 'triggered' directly because it doesn't exist in the database schema
    // So we'll update any relevant fields we can
    const { error } = await supabase
      .from("message_conditions")
      .update({
        last_checked: new Date().toISOString() // Update last_checked timestamp
      })
      .eq("id", conditionId);
    
    if (error) {
      console.error("Error tracking message notification:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in trackMessageNotification:", error);
    throw error;
  }
}

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
    
    // Check if table exists before trying to insert
    try {
      const { data: deliveredMessages, error: tableError } = await supabase
        .from("delivered_messages")
        .select("count")
        .limit(1);

      if (tableError) {
        console.warn("Delivered messages table may not exist, skipping delivery recording");
        console.log("Details:", tableError);
        return null;
      }
      
      // If table exists, check if delivery record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("delivered_messages")
        .select("id")
        .eq("delivery_id", deliveryId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking for existing delivery record:", checkError);
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
    } catch (tableCheckError) {
      console.warn("Error with delivered_messages table:", tableCheckError);
      return null;
    }
  } catch (error) {
    console.error("Error in recordMessageDelivery:", error);
    return null; // Don't throw here, just return null to continue the process
  }
}

/**
 * Update condition status (active/inactive)
 */
export async function updateConditionStatus(conditionId: string, isActive: boolean) {
  try {
    const supabase = supabaseClient();
    
    const { error } = await supabase
      .from("message_conditions")
      .update({
        active: isActive
      })
      .eq("id", conditionId);
    
    if (error) {
      console.error("Error updating condition status:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateConditionStatus:", error);
    throw error;
  }
}

/**
 * Get panic configuration from condition
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
      console.error("Error getting panic config:", error);
      throw error;
    }
    
    return data?.panic_config;
  } catch (error) {
    console.error("Error in getPanicConfig:", error);
    throw error;
  }
}
