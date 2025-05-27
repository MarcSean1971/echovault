import {
  trackMessageNotification,
  updateConditionStatus,
  getPanicConfig,
  recordMessageDelivery
} from "./db/index.ts";
import { Message, Condition } from "./types.ts";
import { notifyRecipient } from "./services/recipient-notification-service.ts";

// Map to track recent message notifications (messageId -> timestamp)
const recentNotifications = new Map<string, number>();

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
  forceSend?: boolean;
  bypassDeduplication?: boolean;
  source?: string;
  skipRecipientNotifications?: boolean;
}

/**
 * SIMPLIFIED: Send final message to recipients when deadline is reached
 */
export async function sendMessageNotification(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { 
    isEmergency = false, 
    debug = false, 
    forceSend = false,
    bypassDeduplication = false, 
    source = 'api',
    skipRecipientNotifications = false
  } = options;
  
  // Skip if no recipients
  if (!condition.recipients || condition.recipients.length === 0) {
    if (debug) console.log(`No recipients for message ${message.id}, skipping notification`);
    return { success: true, message: "No recipients to notify" };
  }
  
  try {
    if (debug) {
      console.log(`[FINAL-DELIVERY] Processing final message delivery for message ${message.id}`);
      console.log(`[FINAL-DELIVERY] Message title: "${message.title}"`);
      console.log(`[FINAL-DELIVERY] Number of recipients: ${condition.recipients.length}`);
    }
    
    // SIMPLIFIED: For final delivery, we ALWAYS send to recipients
    if (skipRecipientNotifications) {
      if (debug) {
        console.log(`[FINAL-DELIVERY] Skip flag is set, but this is final delivery - proceeding anyway`);
      }
    }
    
    // Simple deduplication check
    const now = Date.now();
    const lastNotificationTime = recentNotifications.get(message.id);
    
    // Only skip if notified within last 5 minutes AND not bypassing deduplication
    if (lastNotificationTime && now - lastNotificationTime < 300000 && !bypassDeduplication) {
      if (debug) {
        console.log(`[FINAL-DELIVERY] Message ${message.id} was delivered ${(now - lastNotificationTime) / 1000}s ago. Skipping duplicate.`);
      }
      
      return { 
        success: true, 
        details: "Skipped duplicate final delivery", 
        isDuplicate: true 
      };
    }
    
    // Set this message as recently notified
    recentNotifications.set(message.id, now);
    
    // Cleanup old entries
    for (const [msgId, time] of recentNotifications.entries()) {
      if (now - time > 600000) { // Remove entries older than 10 minutes
        recentNotifications.delete(msgId);
      }
    }
    
    // Check if this is an emergency/panic message
    const isEmergencyMessage = condition.condition_type === 'panic_trigger' || isEmergency;
    
    if (isEmergencyMessage && debug) {
      console.log("[FINAL-DELIVERY] Emergency message - high priority delivery");
    }
    
    // Track the notification in the database
    try {
      await trackMessageNotification(message.id, condition.id);
      if (debug) console.log(`[FINAL-DELIVERY] Successfully tracked notification for message ${message.id}`);
    } catch (trackError) {
      console.error(`[FINAL-DELIVERY] Error tracking message notification: ${trackError}`);
      // Continue despite tracking error
    }
    
    // Create a Set to track recipients who have already been notified
    const notifiedRecipients = new Set();
    
    // Send notification to each recipient
    const recipientResults = await Promise.all(condition.recipients.map(async recipient => {
      // Skip if this recipient has already been processed
      if (notifiedRecipients.has(recipient.id)) {
        console.log(`[FINAL-DELIVERY] Skipping duplicate recipient ${recipient.id} (${recipient.email})`);
        return { 
          success: true, 
          recipient: recipient.email, 
          skipped: true, 
          reason: "Duplicate recipient" 
        };
      }
      
      // Mark recipient as notified
      notifiedRecipients.add(recipient.id);
      
      // Create delivery record
      try {
        const deliveryId = crypto.randomUUID();
        console.log(`[FINAL-DELIVERY] Creating delivery record for message ${message.id}, recipient ${recipient.id}, deliveryId ${deliveryId}`);
        
        await recordMessageDelivery(
          message.id,
          condition.id,
          recipient.id,
          deliveryId
        );
        
        recipient.deliveryId = deliveryId;
      } catch (deliveryError) {
        console.error(`[FINAL-DELIVERY] Error creating delivery record for recipient ${recipient.id}:`, deliveryError);
        // Continue anyway
      }
      
      return notifyRecipient(recipient, message, condition, {
        isEmergency: isEmergencyMessage,
        debug,
        maxRetries: isEmergencyMessage ? 2 : 1,
        retryDelay: 5000,
        isWhatsAppEnabled: condition.panic_config?.methods?.includes('whatsapp') || false,
        triggerKeyword: condition.panic_config?.trigger_keyword || "",
        forceSend,
        source
      });
    }));
    
    const anySuccessful = recipientResults.some(r => r.success);
    const allFailed = recipientResults.every(r => !r.success);
    
    if (debug) {
      console.log(`[FINAL-DELIVERY] Delivery summary: ${recipientResults.filter(r => r.success).length}/${recipientResults.length} successful`);
      if (allFailed) {
        console.error("[FINAL-DELIVERY] ALL DELIVERIES FAILED");
      }
    }
    
    // Deactivate condition after successful delivery (except for recurring conditions)
    if (anySuccessful && condition.condition_type !== 'recurring_check_in') {
      // For panic triggers, check keep_armed setting
      if (condition.condition_type === 'panic_trigger') {
        try {
          let keepArmed = true; // Default to true for safety
          
          if (condition.panic_config?.keep_armed === false) {
            keepArmed = false;
          } else {
            const panicConfig = await getPanicConfig(condition.id);
            keepArmed = panicConfig?.keep_armed ?? true;
          }
          
          if (!keepArmed) {
            if (debug) console.log(`[FINAL-DELIVERY] Deactivating panic condition ${condition.id}`);
            await updateConditionStatus(condition.id, false);
          } else {
            if (debug) console.log(`[FINAL-DELIVERY] Keeping panic condition ${condition.id} active`);
          }
        } catch (configError) {
          console.error("[FINAL-DELIVERY] Error checking panic_config:", configError);
        }
      } else {
        // For all other conditions, deactivate after delivery
        if (debug) console.log(`[FINAL-DELIVERY] Deactivating condition ${condition.id} after successful delivery`);
        await updateConditionStatus(condition.id, false);
      }
    }
    
    return { 
      success: anySuccessful, 
      details: recipientResults,
      error: allFailed ? "All deliveries failed" : undefined
    };
  } catch (error: any) {
    console.error(`[FINAL-DELIVERY] Error delivering final message ${message.id}:`, error);
    return { success: false, error: error.message };
  }
}
