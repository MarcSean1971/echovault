
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
        hours_threshold,
        minutes_threshold,
        last_checked,
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
    
    // Filter conditions that need to be triggered
    const now = new Date();
    const messagesToTrigger = [];
    
    for (const condition of conditions) {
      let shouldTrigger = false;
      
      // For deadman's switch (no_check_in), check if the time threshold has passed
      if (condition.condition_type === 'no_check_in' && condition.last_checked) {
        const lastChecked = new Date(condition.last_checked);
        const thresholdMs = (condition.hours_threshold || 0) * 60 * 60 * 1000 + 
                           (condition.minutes_threshold || 0) * 60 * 1000;
        
        if (now.getTime() - lastChecked.getTime() >= thresholdMs) {
          console.log(`Deadman's switch condition ${condition.id} has passed its threshold`);
          shouldTrigger = true;
        }
      }
      
      // For panic_trigger, these are manually triggered, so if active they should be processed
      if (condition.condition_type === 'panic_trigger') {
        // For panic triggers, we need to check if it's a manual trigger request
        if (messageId && messageId === condition.message_id) {
          console.log(`Manual trigger requested for panic message ${condition.message_id}`);
          shouldTrigger = true;
        }
      }

      // For other condition types, if it's specifically requested by messageId, process it
      if (messageId && messageId === condition.message_id) {
        console.log(`Manual trigger requested for message ${condition.message_id}`);
        shouldTrigger = true;
      }
      
      if (shouldTrigger) {
        // If we should trigger, get the message details
        const { data: message, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .eq("id", condition.message_id)
          .single();
        
        if (!msgError && message) {
          messagesToTrigger.push({
            condition,
            message
          });
        } else {
          console.error(`Error fetching message ${condition.message_id}:`, msgError);
        }
      }
    }
    
    console.log(`Found ${messagesToTrigger.length} messages to notify out of ${conditions.length} active conditions`);
    return messagesToTrigger;
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
    
    // Check if delivery record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("delivered_messages")
      .select("id")
      .eq("delivery_id", deliveryId)
      .maybeSingle();
      
    if (checkError && checkError.code !== "42P01") {
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
      if (error.code === "42P01") {
        console.warn("delivered_messages table may not exist yet");
      } else {
        throw error;
      }
    } else {
      console.log(`Successfully created delivery record: ${deliveryId} for message ${messageId}`);
    }
    
    return data;
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
