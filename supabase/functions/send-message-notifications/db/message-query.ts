
import { supabaseClient } from "../supabase-client.ts";
import { Message, Condition } from "../types.ts";

interface MessageToRemind {
  message: Message;
  condition: Condition;
  hoursUntilDeadline: number;
  reminderHours: number[];
}

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
