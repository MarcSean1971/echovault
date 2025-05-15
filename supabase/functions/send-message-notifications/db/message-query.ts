
import { supabaseClient } from "../supabase-client.ts";
import { Message, Condition } from "../types.ts";

/**
 * Get messages that need notifications to be sent
 */
export async function getMessagesToNotify(messageId?: string) {
  try {
    const supabase = supabaseClient();
    console.log(`[getMessagesToNotify] Starting with${messageId ? ` specific messageId: ${messageId}` : ' no specific messageId'}`);
    
    // If specific message ID is provided, get it directly regardless of other conditions
    if (messageId) {
      console.log(`[getMessagesToNotify] Direct message request for ID: ${messageId}`);
      
      // First get the condition for the message
      const { data: conditions, error: conditionError } = await supabase
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
          panic_config,
          active
        `)
        .eq("message_id", messageId);
      
      if (conditionError) {
        console.error(`[getMessagesToNotify] Error fetching condition for message ${messageId}:`, conditionError);
        throw conditionError;
      }
      
      // If not found or no conditions, return empty array
      if (!conditions || conditions.length === 0) {
        console.log(`[getMessagesToNotify] No conditions found for message ${messageId}`);
        return [];
      }
      
      // Get the most relevant condition - prefer active over inactive
      const activeConditions = conditions.filter(c => c.active);
      const condition = activeConditions.length > 0 ? activeConditions[0] : conditions[0];
      
      console.log(`[getMessagesToNotify] Found condition ${condition.id} of type ${condition.condition_type} for message ${messageId}`);
      console.log(`[getMessagesToNotify] Condition active status: ${condition.active}`);
      
      // Get the message details
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();
      
      if (messageError) {
        console.error(`[getMessagesToNotify] Error fetching message ${messageId}:`, messageError);
        throw messageError;
      }
      
      if (!message) {
        console.log(`[getMessagesToNotify] Message ${messageId} not found in database`);
        return [];
      }
      
      console.log(`[getMessagesToNotify] Successfully found message for direct delivery: "${message.title}"`);
      
      // Return the message and condition for processing - direct request overrides regular rules
      return [{
        message,
        condition
      }];
    }
    
    // Regular flow for checking conditions - only when no specific messageId is provided
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
    
    const { data: conditions, error } = await query;
    
    if (error) {
      console.error("[getMessagesToNotify] Error fetching message conditions:", error);
      throw error;
    }
    
    if (!conditions || conditions.length === 0) {
      console.log("[getMessagesToNotify] No active conditions found");
      return [];
    }
    
    console.log(`[getMessagesToNotify] Found ${conditions.length} active conditions to check`);
    
    // Filter conditions that need to be triggered
    const now = new Date();
    const messagesToTrigger = [];
    
    // Add a larger buffer time (in ms) to ensure we catch deadlines that are very close
    const bufferTimeMs = 60 * 1000; // 60 seconds buffer - more aggressive
    
    for (const condition of conditions) {
      let shouldTrigger = false;
      
      // For deadman's switch (no_check_in), check if the time threshold has passed
      if (condition.condition_type === 'no_check_in' && condition.last_checked) {
        const lastChecked = new Date(condition.last_checked);
        const thresholdMs = (condition.hours_threshold || 0) * 60 * 60 * 1000 + 
                           (condition.minutes_threshold || 0) * 60 * 1000;
        
        const deadline = new Date(lastChecked.getTime() + thresholdMs);
        console.log(`[getMessagesToNotify] Checking no_check_in condition ${condition.id} - deadline: ${deadline.toISOString()}, now: ${now.toISOString()}`);
        console.log(`[getMessagesToNotify] Time until deadline: ${(deadline.getTime() - now.getTime()) / (60 * 1000)} minutes`);
        
        // Check if deadline has passed OR if we're very close to the deadline (within buffer time)
        if (now.getTime() >= deadline.getTime() || 
            (deadline.getTime() - now.getTime() <= bufferTimeMs)) {
          
          if (now.getTime() >= deadline.getTime()) {
            console.log(`[getMessagesToNotify] ALERT: Deadman's switch condition ${condition.id} has passed its threshold! Triggering notification.`);
          } else {
            console.log(`[getMessagesToNotify] ALERT: Deadman's switch condition ${condition.id} is within buffer time (${bufferTimeMs/1000}s) of deadline! Preemptively triggering notification.`);
          }
          shouldTrigger = true;
        }
      }
      
      // For panic_trigger, these are manually triggered, so if active they should be processed
      if (condition.condition_type === 'panic_trigger') {
        // For panic triggers, we need a manual trigger flag in the request
        console.log(`[getMessagesToNotify] Skipping panic trigger ${condition.id} as no manual trigger was requested`);
      }

      if (shouldTrigger) {
        // If we should trigger, get the message details
        const { data: message, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .eq("id", condition.message_id)
          .single();
        
        if (!msgError && message) {
          console.log(`[getMessagesToNotify] Adding message "${message.title}" (ID: ${message.id}) to delivery queue`);
          messagesToTrigger.push({
            condition,
            message
          });
        } else {
          console.error(`[getMessagesToNotify] Error fetching message ${condition.message_id}:`, msgError);
        }
      }
    }
    
    console.log(`[getMessagesToNotify] Found ${messagesToTrigger.length} messages to notify out of ${conditions.length} active conditions`);
    return messagesToTrigger;
  } catch (error) {
    console.error("[getMessagesToNotify] Error in getMessagesToNotify:", error);
    throw error;
  }
}
