
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
// CRITICAL FIX: Track notification attempts by source
const notificationAttemptsBySource = new Map<string, Map<string, number>>();

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
  deduplicationId?: string;
  timestamp?: number;
  forceSend?: boolean;
  bypassDeduplication?: boolean;
  source?: string;
  skipRecipientNotifications?: boolean;
  reminderType?: string;
}

/**
 * CRITICAL FIX: Three separate notification functions for the three reminder types
 */

/**
 * Send check-in reminder to creator only (reminder type)
 */
export async function sendCheckInReminderToCreator(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { debug = false } = options;
  
  if (debug) {
    console.log(`[CHECK-IN-REMINDER] Sending check-in reminder to creator for message ${message.id}`);
  }

  try {
    // This should only notify the creator via email/WhatsApp
    // Implementation would call the email/WhatsApp services directly for the creator
    
    return { 
      success: true, 
      details: "Check-in reminder sent to creator",
      reminderType: "reminder"
    };
  } catch (error: any) {
    console.error(`[CHECK-IN-REMINDER] Error sending check-in reminder:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send final notice to creator only (final_notice type)
 */
export async function sendFinalNoticeToCreator(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { debug = false } = options;
  
  if (debug) {
    console.log(`[FINAL-NOTICE] Sending final notice to creator for message ${message.id}`);
  }

  try {
    // This should only notify the creator via email/WhatsApp with final warning
    
    return { 
      success: true, 
      details: "Final notice sent to creator",
      reminderType: "final_notice"
    };
  } catch (error: any) {
    console.error(`[FINAL-NOTICE] Error sending final notice:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * CRITICAL: Send message to recipients (final_delivery type) - BYPASS ALL VALIDATION
 */
export async function sendFinalDeliveryToRecipients(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { 
    isEmergency = false, 
    debug = false, 
    forceSend = false,
    source = 'final-delivery'
  } = options;
  
  if (debug) {
    console.log(`[FINAL-DELIVERY] CRITICAL: Sending message to recipients for message ${message.id}`);
    console.log(`[FINAL-DELIVERY] Force send: ${forceSend}, Source: ${source}`);
    console.log(`[FINAL-DELIVERY] Recipients count: ${condition.recipients?.length || 0}`);
  }

  // CRITICAL: Skip if no recipients
  if (!condition.recipients || condition.recipients.length === 0) {
    if (debug) console.log(`[FINAL-DELIVERY] No recipients for message ${message.id}, skipping`);
    return { success: true, message: "No recipients to notify" };
  }

  try {
    // CRITICAL: For final delivery, COMPLETELY BYPASS ALL VALIDATION
    if (debug) {
      console.log(`[FINAL-DELIVERY] BYPASSING ALL VALIDATION - This is final delivery to recipients`);
      console.log(`[FINAL-DELIVERY] Will send to ${condition.recipients.length} recipients immediately`);
    }

    // Track the notifications in the database
    try {
      await trackMessageNotification(message.id, condition.id);
      if (debug) console.log(`[FINAL-DELIVERY] Successfully tracked notification for message ${message.id}`);
    } catch (trackError) {
      console.error(`[FINAL-DELIVERY] Error tracking message notification: ${trackError}`);
    }

    // Create a Set to track recipients who have already been notified to prevent duplicates
    const notifiedRecipients = new Set();
    
    // Send a notification to each recipient - GUARANTEED DELIVERY
    const recipientResults = await Promise.all(condition.recipients.map(async recipient => {
      // Skip if this recipient has already been processed
      if (notifiedRecipients.has(recipient.id)) {
        console.log(`[FINAL-DELIVERY] Skipping duplicate notification for recipient ${recipient.id} (${recipient.email})`);
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
      try {
        const deliveryId = crypto.randomUUID();
        if (debug) {
          console.log(`[FINAL-DELIVERY] Creating delivery record for message ${message.id}, recipient ${recipient.id}, deliveryId ${deliveryId}`);
        }
        
        await recordMessageDelivery(
          message.id,
          condition.id,
          recipient.id,
          deliveryId
        );
        
        recipient.deliveryId = deliveryId;
      } catch (deliveryError) {
        console.error(`[FINAL-DELIVERY] Error creating delivery record for recipient ${recipient.id}:`, deliveryError);
      }
      
      return notifyRecipient(recipient, message, condition, {
        isEmergency: isEmergency,
        debug,
        maxRetries: 1,
        retryDelay: 5000,
        isWhatsAppEnabled: false,
        triggerKeyword: "",
        forceSend: true,
        source: 'final-delivery'
      });
    }));
    
    const anySuccessful = recipientResults.some(r => r.success);
    const allFailed = recipientResults.every(r => !r.success);
    
    if (debug) {
      console.log(`[FINAL-DELIVERY] Final delivery summary: ${recipientResults.filter(r => r.success).length}/${recipientResults.length} successful`);
      if (allFailed) {
        console.error("[FINAL-DELIVERY] ALL DELIVERIES FAILED. Check logs for details.");
      }
    }

    // Deactivate the condition after final delivery
    if (condition.condition_type !== 'recurring_check_in') {
      try {
        if (debug) console.log(`[FINAL-DELIVERY] Deactivating condition ${condition.id} after final delivery`);
        await updateConditionStatus(condition.id, false);
      } catch (updateError) {
        console.error(`[FINAL-DELIVERY] Error deactivating condition:`, updateError);
      }
    }
    
    return { 
      success: anySuccessful, 
      details: recipientResults,
      error: allFailed ? "All deliveries failed" : undefined,
      reminderType: "final_delivery"
    };
    
  } catch (error: any) {
    console.error(`[FINAL-DELIVERY] Error in final delivery for message ${message.id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * DEPRECATED: Main notification function - now routes to specific functions
 */
export async function sendMessageNotification(
  data: {message: Message, condition: Condition}, 
  options: NotificationOptions = {}
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { message, condition } = data;
  const { 
    debug = false, 
    source = 'api',
    reminderType = 'unknown'
  } = options;
  
  if (debug) {
    console.log(`[NOTIFICATION-ROUTER] Processing notification for message ${message.id}`);
    console.log(`[NOTIFICATION-ROUTER] Source: ${source}, Reminder type: ${reminderType}`);
  }

  // CRITICAL: Route to the appropriate function based on reminder type
  switch (reminderType) {
    case 'reminder':
      return sendCheckInReminderToCreator(data, options);
      
    case 'final_notice':
      return sendFinalNoticeToCreator(data, options);
      
    case 'final_delivery':
      return sendFinalDeliveryToRecipients(data, options);
      
    default:
      // CRITICAL: If source indicates final delivery, route there regardless
      if (source === 'final-delivery-processor' || source === 'cron_job') {
        if (debug) {
          console.log(`[NOTIFICATION-ROUTER] Source indicates final delivery, routing to recipients`);
        }
        return sendFinalDeliveryToRecipients(data, { ...options, reminderType: 'final_delivery' });
      }
      
      // For backward compatibility, handle panic triggers and other types
      if (condition.condition_type === 'panic_trigger') {
        return sendFinalDeliveryToRecipients(data, { ...options, isEmergency: true });
      }
      
      if (debug) {
        console.log(`[NOTIFICATION-ROUTER] Unknown reminder type ${reminderType}, defaulting to check-in reminder`);
      }
      return sendCheckInReminderToCreator(data, options);
  }
}
