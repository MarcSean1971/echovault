import {
  trackMessageNotification,
  updateConditionStatus,
  getPanicConfig
} from "./db-service.ts";
import { Message, Condition } from "./types.ts";
import { notifyRecipient } from "./services/recipient-notification-service.ts";

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
}

export { generateAccessUrl } from "./utils/url-generator.ts";

export async function sendMessageNotification(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { isEmergency = false, debug = false } = options;
  
  // Skip if no recipients
  if (!condition.recipients || condition.recipients.length === 0) {
    if (debug) console.log(`No recipients for message ${message.id}, skipping notification`);
    return { success: true, message: "No recipients to notify" };
  }
  
  try {
    if (debug) {
      console.log(`Processing message notification for message ${message.id}`);
      console.log(`Message condition type: ${condition.condition_type}`);
      console.log(`Is emergency flag: ${isEmergency}`);
      console.log(`Message title: "${message.title}"`);
      console.log(`Number of recipients: ${condition.recipients.length}`);
      console.log(`User ID: ${message.user_id}`);
      console.log(`Condition data:`, JSON.stringify(condition, null, 2));
    }
    
    // Check if this is an emergency/panic message for special handling
    // Either from condition type or from the isEmergency flag
    const isEmergencyMessage = condition.condition_type === 'panic_trigger' || isEmergency;
    
    if (isEmergencyMessage && debug) {
      console.log("THIS IS AN EMERGENCY MESSAGE - Special handling activated");
    }
    
    // Track the notifications in the database
    try {
      await trackMessageNotification(message.id, condition.id);
      if (debug) console.log(`Successfully tracked notification for message ${message.id}`);
    } catch (trackError) {
      console.error(`Error tracking message notification: ${trackError}`);
      // Continue despite tracking error - don't block email sending
    }
    
    // For emergency messages, attempt multiple deliveries with retry
    const maxRetries = isEmergencyMessage ? 3 : 1;
    const retryDelay = 5000; // 5 seconds between retries for emergency messages
    
    // Check if this is a WhatsApp-enabled panic trigger
    let isWhatsAppEnabled = false;
    let triggerKeyword = "";
    
    if (condition.condition_type === 'panic_trigger') {
      const panicConfig = condition.panic_config || {};
      if (panicConfig.methods && panicConfig.methods.includes('whatsapp')) {
        isWhatsAppEnabled = true;
        triggerKeyword = panicConfig.trigger_keyword || "SOS";
        if (debug) console.log(`WhatsApp triggers enabled with keyword: ${triggerKeyword}`);
      }
    }
    
    // Send a notification to each recipient
    const recipientResults = await Promise.all(condition.recipients.map(recipient => 
      notifyRecipient(recipient, message, condition, {
        isEmergency: isEmergencyMessage,
        debug,
        maxRetries,
        retryDelay,
        isWhatsAppEnabled,
        triggerKeyword
      })
    ));
    
    const anySuccessful = recipientResults.some(r => r.success);
    const allFailed = recipientResults.every(r => !r.success);
    
    if (debug) {
      console.log(`Email sending summary: ${recipientResults.filter(r => r.success).length}/${recipientResults.length} successful`);
      if (allFailed) {
        console.error("ALL EMAIL DELIVERIES FAILED. Check logs for details.");
      }
    }
    
    // Only mark the condition as inactive if it's not a recurring trigger or special case
    if (condition.condition_type !== 'recurring_check_in') {
      // For panic triggers, we need to check if keep_armed is true
      if (condition.condition_type === 'panic_trigger') {
        try {
          // Get the keep_armed setting directly from the panic_config
          let keepArmed = true; // Default to true for safety
          
          if (condition.panic_config) {
            // If keep_armed is explicitly set to false, we'll deactivate the condition
            if (condition.panic_config.keep_armed === false) {
              keepArmed = false;
            }
            if (debug) console.log(`Panic trigger - keep_armed setting from condition is: ${keepArmed}`);
          } else {
            // If no panic_config, try to get it from the database
            const panicConfig = await getPanicConfig(condition.id);
            keepArmed = panicConfig?.keep_armed ?? true;
            if (debug) console.log(`Panic trigger - keep_armed setting from database is: ${keepArmed}`);
          }
          
          if (!keepArmed) {
            // Deactivate the condition
            if (debug) console.log(`Deactivating condition ${condition.id}`);
            await updateConditionStatus(condition.id, false);
          } else {
            if (debug) console.log(`Keeping condition ${condition.id} active as keep_armed is true`);
          }
        } catch (configError) {
          console.error("Error checking panic_config:", configError);
          // Default to not deactivating in case of error
        }
      } else {
        // For all other non-recurring conditions, mark as inactive after delivery
        if (debug) console.log(`Deactivating non-recurring condition ${condition.id} after delivery`);
        await updateConditionStatus(condition.id, false);
      }
    }
    
    return { 
      success: anySuccessful, 
      details: recipientResults,
      error: allFailed ? "All email deliveries failed" : undefined
    };
  } catch (error: any) {
    console.error(`Error notifying recipients for message ${message.id}:`, error);
    return { success: false, error: error.message };
  }
}
