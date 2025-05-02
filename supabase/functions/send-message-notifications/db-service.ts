
import { supabaseClient } from "./supabase-client.ts";
import { Message, Condition } from "./types.ts";

export async function getMessagesToNotify(specificMessageId?: string): Promise<Array<{message: Message, condition: Condition}>> {
  const supabase = supabaseClient();
  
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
    query = query.eq('message_id', specificMessageId);
  } else {
    // Otherwise, get messages due for delivery based on trigger conditions
    // Include panic_trigger in the list of conditions to check
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
        .select('id, active')
        .eq('message_id', specificMessageId)
        .maybeSingle();
        
      if (inactiveCheck) {
        console.log(`Found message ${specificMessageId} but it's not active (active=${inactiveCheck.active})`);
      } else {
        console.log(`Message with ID ${specificMessageId} does not exist`);
      }
    }
  }
  
  // Filter and map the conditions to return both message and condition information
  return (conditions || [])
    .filter(condition => condition.messages) // Ensure the message exists
    .map(condition => ({
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
        panic_config: condition.panic_config
      }
    }));
}

export async function trackMessageNotification(messageId: string, conditionId: string) {
  const supabase = supabaseClient();
  
  try {
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
  } catch (error) {
    console.error("Error in trackMessageNotification:", error);
    // Don't let tracking failures stop the notification process
  }
}

export async function recordMessageDelivery(messageId: string, conditionId: string, recipientId: string, deliveryId: string) {
  const supabase = supabaseClient();
  
  try {
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
    }
  } catch (error) {
    // Don't let delivery recording failure stop the process
    console.warn("Error recording message delivery:", error);
  }
}

export async function updateConditionStatus(conditionId: string, active: boolean) {
  const supabase = supabaseClient();
  
  try {
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
    const { data, error } = await supabase
      .from('message_conditions')
      .select('panic_config')
      .eq('id', conditionId)
      .single();
      
    if (error) {
      console.error("Error checking panic_config:", error);
      throw error;
    }
    
    console.log(`Panic config for condition ${conditionId}:`, data?.panic_config);
    
    return data?.panic_config;
  } catch (error) {
    console.error("Error in getPanicConfig:", error);
    return null;
  }
}
