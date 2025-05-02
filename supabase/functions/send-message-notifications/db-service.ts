
import { supabaseClient } from "./supabase-client.ts";
import { Message, Condition } from "./types.ts";

export async function getMessagesToNotify(specificMessageId?: string): Promise<Array<{message: Message, condition: Condition}>> {
  const supabase = supabaseClient();
  
  console.log(`GetMessagesToNotify called ${specificMessageId ? `for specific message ID: ${specificMessageId}` : 'for all eligible messages'}`);
  
  // Start building the query
  let query = supabase
    .from('message_conditions')
    .select(`
      *,
      messages:message_id (
        id, title, content, message_type, attachments, user_id
      )
    `)
    .eq('active', true); // Only get active conditions
  
  if (specificMessageId) {
    // If a specific message ID is provided, only get that one - this is important for panic triggers
    console.log(`Filtering for specific message ID: ${specificMessageId}`);
    query = query.eq('message_id', specificMessageId);
  } else {
    // Otherwise, get messages due for delivery based on trigger conditions
    // Include panic_trigger in the list of conditions to check
    console.log("Filtering for eligible message conditions (trigger_date <= now, etc.)");
    query = query.or('trigger_date.lte.now(),condition_type.eq.inactivity_to_date,condition_type.eq.no_check_in,condition_type.eq.panic_trigger');
  }
  
  const { data: conditions, error } = await query;
  
  if (error) {
    console.error("Error fetching messages to notify:", error);
    throw error;
  }
  
  if (!conditions || conditions.length === 0) {
    console.log(`No messages found to notify${specificMessageId ? ` for message ID ${specificMessageId}` : ''}`);
    if (specificMessageId) {
      // Double check if the message exists but is not active
      const { data: inactiveCheck } = await supabase
        .from('message_conditions')
        .select('id, active, condition_type')
        .eq('message_id', specificMessageId)
        .maybeSingle();
        
      if (inactiveCheck) {
        console.log(`Found message ${specificMessageId} but it's not active (active=${inactiveCheck.active}, type=${inactiveCheck.condition_type})`);
      } else {
        console.log(`Message with ID ${specificMessageId} does not exist`);
      }
    }
    return [];
  }
  
  console.log(`Found ${conditions.length} active conditions eligible for notification`);
  
  // Filter and map the conditions to return both message and condition information
  const messagesToNotify = (conditions || [])
    .filter(condition => {
      // Make sure message exists
      if (!condition.messages) {
        console.log(`Condition ${condition.id} has no associated message, skipping`);
        return false;
      }
      return true;
    })
    .map(condition => {
      // Log each condition we're processing
      console.log(`Processing condition ID: ${condition.id}, type: ${condition.condition_type}, message: ${condition.messages?.title}`);
      
      // Ensure the panic_config is processed properly
      let panicConfig = condition.panic_config;
      
      // If we have panic_trigger_config but not panic_config, use that instead
      if (!panicConfig && condition.panic_trigger_config) {
        console.log(`Using panic_trigger_config for condition ${condition.id} as panic_config is not available`);
        panicConfig = condition.panic_trigger_config;
      }
      
      return {
        message: condition.messages as unknown as Message,
        condition: {
          id: condition.id,
          message_id: condition.message_id,
          condition_type: condition.condition_type,
          active: condition.active,
          recipients: condition.recipients as any[],
          pin_code: condition.pin_code,
          unlock_delay_hours: condition.unlock_delay_hours,
          expiry_hours: condition.expiry_hours,
          trigger_date: condition.trigger_date,
          panic_config: panicConfig
        }
      };
    });
    
  console.log(`Returning ${messagesToNotify.length} messages to notify`);
  return messagesToNotify;
}

export async function trackMessageNotification(messageId: string, conditionId: string) {
  const supabase = supabaseClient();
  
  try {
    console.log(`Tracking notification for message ${messageId}, condition ${conditionId}`);
    
    const { error } = await supabase
      .from('sent_reminders')
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        sent_at: new Date().toISOString(),
        deadline: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now as default
      });
    
    if (error) {
      console.error("Error tracking message notification:", error);
      throw error;
    }
    
    console.log(`Successfully tracked notification for message ${messageId}`);
  } catch (error) {
    console.error("Error in trackMessageNotification:", error);
    // Don't let tracking failures stop the notification process
  }
}

export async function recordMessageDelivery(messageId: string, conditionId: string, recipientId: string, deliveryId: string) {
  const supabase = supabaseClient();
  
  try {
    console.log(`Recording message delivery: message=${messageId}, recipient=${recipientId}, delivery=${deliveryId}`);
    
    // Check if we have a delivered_messages table
    const { error } = await supabase
      .from('delivered_messages')
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        recipient_id: recipientId,
        delivery_id: deliveryId,
        delivered_at: new Date().toISOString()
      });
    
    if (error) {
      // If the table doesn't exist, just log and continue - this isn't critical
      console.warn("Could not record message delivery:", error);
    } else {
      console.log(`Successfully recorded delivery for message ${messageId} to recipient ${recipientId}`);
    }
  } catch (error) {
    // Don't let delivery recording failure stop the process
    console.warn("Error recording message delivery:", error);
  }
}

export async function updateConditionStatus(conditionId: string, active: boolean) {
  const supabase = supabaseClient();
  
  try {
    console.log(`Updating condition ${conditionId} status to ${active ? 'active' : 'inactive'}`);
    
    const { error } = await supabase
      .from('message_conditions')
      .update({ active })
      .eq('id', conditionId);
    
    if (error) {
      console.error("Error updating condition status:", error);
      throw error;
    }
    
    console.log(`Successfully ${active ? 'activated' : 'deactivated'} condition ${conditionId}`);
  } catch (error) {
    console.error(`Failed to ${active ? 'activate' : 'deactivate'} condition ${conditionId}:`, error);
    throw error;
  }
}

export async function getPanicConfig(conditionId: string) {
  const supabase = supabaseClient();
  
  try {
    console.log(`Getting panic config for condition ${conditionId}`);
    
    const { data, error } = await supabase
      .from('message_conditions')
      .select('panic_config, panic_trigger_config')
      .eq('id', conditionId)
      .single();
      
    if (error) {
      console.error("Error checking panic configurations:", error);
      throw error;
    }
    
    // First try panic_config, then fall back to panic_trigger_config
    let panicConfig = data?.panic_config;
    
    if (!panicConfig && data?.panic_trigger_config) {
      console.log(`Using panic_trigger_config for condition ${conditionId} as panic_config is not available`);
      panicConfig = data.panic_trigger_config;
    }
    
    console.log(`Panic config for condition ${conditionId}:`, panicConfig);
    
    return panicConfig;
  } catch (error) {
    console.error("Error in getPanicConfig:", error);
    return null;
  }
}
