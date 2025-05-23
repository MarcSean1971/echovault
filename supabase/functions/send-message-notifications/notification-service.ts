
import {
  trackMessageNotification,
  updateConditionStatus,
  getPanicConfig,
  recordMessageDelivery
} from "./db/index.ts";
import { Message, Condition } from "./types.ts";
import { notifyRecipient } from "./services/recipient-notification-service.ts";
import { generateAccessUrl } from "./utils/url-generator.ts";

// Map to track recent message notifications (messageId -> timestamp)
const recentNotifications = new Map<string, number>();

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
  deduplicationId?: string;
  timestamp?: number;
  forceSend?: boolean;       // ADDED: Force send option
  bypassDeduplication?: boolean; // ADDED: Option to explicitly bypass deduplication
  source?: string;           // ADDED: Source of the notification request
}

export async function sendMessageNotification(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { 
    isEmergency = false, 
    debug = false, 
    deduplicationId, 
    timestamp, 
    forceSend = false,
    bypassDeduplication = false, 
    source = 'api'
  } = options;
  
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
      console.log(`Force send flag: ${forceSend}`);
      console.log(`Bypass deduplication flag: ${bypassDeduplication}`);
      console.log(`Source: ${source}`);
      console.log(`Message title: "${message.title}"`);
      console.log(`Number of recipients: ${condition.recipients.length}`);
      console.log(`User ID: ${message.user_id}`);
      console.log(`Deduplication ID: ${deduplicationId || "None"}`);
      console.log(`Timestamp: ${timestamp || "None"}`);
      console.log(`Condition data:`, JSON.stringify(condition, null, 2));
    }
    
    // Check if this is from WhatsApp selection
    const isFromWhatsApp = source && (
      source === 'whatsapp_trigger_single' || 
      source === 'whatsapp_selection_single' || 
      source === 'whatsapp_selection_all' ||
      source === 'whatsapp_selection_fallback'
    );
    
    if (isFromWhatsApp && debug) {
      console.log(`CRITICAL: This is a WhatsApp-triggered notification from ${source}. Bypassing deduplication.`);
    }
    
    // CRITICAL FIX: Add deduplication check, but bypass it for WhatsApp selections
    const now = Date.now();
    const lastNotificationTime = recentNotifications.get(message.id);
    
    // If this message was notified within the last 30 seconds, don't send another notification
    // UNLESS it's a WhatsApp selection or bypassDeduplication is set to true
    if (lastNotificationTime && now - lastNotificationTime < 30000 && !bypassDeduplication && !isFromWhatsApp) {
      if (debug) {
        console.log(`Message ${message.id} was already notified ${(now - lastNotificationTime) / 1000}s ago. Skipping duplicate notification.`);
      }
      
      return { 
        success: true, 
        details: "Skipped duplicate notification", 
        isDuplicate: true 
      };
    }
    
    // Set this message as recently notified
    recentNotifications.set(message.id, now);
    
    // Cleanup old entries from the deduplication map
    for (const [msgId, time] of recentNotifications.entries()) {
      if (now - time > 60000) { // Remove entries older than 1 minute
        recentNotifications.delete(msgId);
      }
    }
    
    // Check if this is an emergency/panic message for special handling
    // Either from condition type or from the isEmergency flag
    const isEmergencyMessage = condition.condition_type === 'panic_trigger' || isEmergency;
    
    if (isEmergencyMessage && debug) {
      console.log("THIS IS AN EMERGENCY MESSAGE - Special handling activated");
    }
    
    // Track the notifications in the database - important to do this ONCE before sending any notifications
    try {
      await trackMessageNotification(message.id, condition.id);
      if (debug) console.log(`Successfully tracked notification for message ${message.id}`);
    } catch (trackError) {
      console.error(`Error tracking message notification: ${trackError}`);
      // Continue despite tracking error - don't block email sending
    }
    
    // For emergency messages, attempt multiple deliveries with retry
    const maxRetries = isEmergencyMessage ? 2 : 1; // Reduced max retries from 3 to 2
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
    
    // Create a Set to track recipients who have already been notified to prevent duplicates
    const notifiedRecipients = new Set();
    
    // Send a notification to each recipient - ONCE only!
    const recipientResults = await Promise.all(condition.recipients.map(async recipient => {
      // Skip if this recipient has already been processed
      if (notifiedRecipients.has(recipient.id)) {
        console.log(`Skipping duplicate notification for recipient ${recipient.id} (${recipient.email})`);
        return { 
          success: true, 
          recipient: recipient.email, 
          skipped: true, 
          reason: "Duplicate recipient" 
        };
      }
      
      // Mark recipient as notified to prevent duplicates
      notifiedRecipients.add(recipient.id);
      
      // Create delivery record for each recipient BEFORE sending notification
      // This ensures the delivery record exists when the recipient clicks the link
      try {
        // Generate a unique delivery ID - CRITICAL FIX: This is stored as TEXT in the database
        const deliveryId = crypto.randomUUID();
        console.log(`Creating delivery record for message ${message.id}, recipient ${recipient.id}, deliveryId ${deliveryId}`);
        
        // Record the delivery in the database
        await recordMessageDelivery(
          message.id,
          condition.id,
          recipient.id,
          deliveryId
        );
        
        // Attach the deliveryId to the recipient for use in notification
        recipient.deliveryId = deliveryId;
      } catch (deliveryError) {
        console.error(`Error creating delivery record for recipient ${recipient.id}:`, deliveryError);
        // Continue anyway to attempt notification delivery
      }
      
      return notifyRecipient(recipient, message, condition, {
        isEmergency: isEmergencyMessage,
        debug,
        maxRetries,
        retryDelay,
        isWhatsAppEnabled,
        triggerKeyword
      });
    }));
    
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
