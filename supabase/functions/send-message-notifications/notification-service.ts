
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
  forceSend?: boolean;       // ADDED: Force send option
  bypassDeduplication?: boolean; // ADDED: Option to explicitly bypass deduplication
  source?: string;           // ADDED: Source of the notification request
}

/**
 * ENHANCED: Added strict deadline validation to prevent premature final delivery
 */
function validateDeadlineForRecipientNotification(condition: Condition, debug: boolean = false): boolean {
  const now = new Date();
  
  // Only apply deadline validation for check-in based conditions
  if (condition.condition_type === 'no_check_in' && condition.last_checked) {
    const lastChecked = new Date(condition.last_checked);
    const hoursThreshold = condition.hours_threshold || 0;
    const minutesThreshold = condition.minutes_threshold || 0;
    const actualDeadline = new Date(lastChecked);
    
    actualDeadline.setHours(actualDeadline.getHours() + hoursThreshold);
    actualDeadline.setMinutes(actualDeadline.getMinutes() + minutesThreshold);
    
    const minutesUntilDeadline = (actualDeadline.getTime() - now.getTime()) / (1000 * 60);
    
    if (debug) {
      console.log(`[RECIPIENT-VALIDATION] Deadline check for condition ${condition.id}`);
      console.log(`[RECIPIENT-VALIDATION] Last checked: ${lastChecked.toISOString()}`);
      console.log(`[RECIPIENT-VALIDATION] Actual deadline: ${actualDeadline.toISOString()}`);
      console.log(`[RECIPIENT-VALIDATION] Current time: ${now.toISOString()}`);
      console.log(`[RECIPIENT-VALIDATION] Minutes until deadline: ${minutesUntilDeadline.toFixed(2)}`);
    }
    
    // STRICT VALIDATION: Must be past the actual deadline
    if (now < actualDeadline) {
      if (debug) {
        console.log(`[RECIPIENT-VALIDATION] BLOCKING recipient notification - deadline not reached (${minutesUntilDeadline.toFixed(2)} minutes remaining)`);
      }
      return false;
    }
    
    // ADDITIONAL SAFEGUARD: Check for recent check-ins (within last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (lastChecked > fiveMinutesAgo) {
      if (debug) {
        console.log(`[RECIPIENT-VALIDATION] BLOCKING recipient notification - recent check-in detected at ${lastChecked.toISOString()}`);
      }
      return false;
    }
    
    if (debug) {
      console.log(`[RECIPIENT-VALIDATION] APPROVED recipient notification - deadline passed and no recent check-in`);
    }
    return true;
  }
  
  // For other condition types, allow notification (they have their own validation logic)
  return true;
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
    
    // CRITICAL NEW VALIDATION: Check deadline before proceeding with recipient notifications
    if (!forceSend && !isEmergency) {
      const deadlineValid = validateDeadlineForRecipientNotification(condition, debug);
      if (!deadlineValid) {
        if (debug) {
          console.log(`[NOTIFICATION-SERVICE] BLOCKED - Deadline validation failed for message ${message.id}`);
        }
        return { 
          success: false, 
          error: "Deadline not reached or recent check-in detected",
          details: "Notification blocked by deadline validation"
        };
      }
    }
    
    // Check if this is from WhatsApp or a reminder trigger
    const isFromWhatsApp = source && (
      source === 'whatsapp_trigger_single' || 
      source === 'whatsapp_selection_single' || 
      source === 'whatsapp_selection_all' ||
      source === 'whatsapp_selection_fallback' ||
      source === 'whatsapp-checkin'
    );
    
    const isReminderTriggered = source && (
      source === 'reminder_schedule_trigger' ||
      source === 'reminder-schedule-direct-trigger' ||
      source === 'reminder-schedule-update' ||
      source === 'obsolete-immediate-check'
    );
    
    if (isFromWhatsApp && debug) {
      console.log(`CRITICAL: This is a WhatsApp-triggered notification from ${source}. Bypassing deduplication.`);
    }
    
    if (isReminderTriggered && debug) {
      console.log(`CRITICAL: This is a reminder-triggered notification from ${source}. Bypassing deduplication.`);
    }
    
    // CRITICAL FIX: More intelligent deduplication with source tracking
    const now = Date.now();
    const lastNotificationTime = recentNotifications.get(message.id);
    
    // Track attempts by source
    if (!notificationAttemptsBySource.has(source)) {
      notificationAttemptsBySource.set(source, new Map<string, number>());
    }
    const sourceMap = notificationAttemptsBySource.get(source)!;
    const lastSourceAttempt = sourceMap.get(message.id) || 0;
    sourceMap.set(message.id, now);
    
    // If this message was notified within the last 15 seconds, don't send another notification
    // UNLESS it's a WhatsApp selection, reminder trigger, or bypassDeduplication is set to true
    if (lastNotificationTime && now - lastNotificationTime < 15000 && 
        !bypassDeduplication && !isFromWhatsApp && !isReminderTriggered) {
      
      // For the same source, require a longer delay (30 seconds) to prevent rapid firing
      if (now - lastSourceAttempt < 30000) {
        if (debug) {
          console.log(`Message ${message.id} was already notified by source ${source} ${(now - lastSourceAttempt) / 1000}s ago. Skipping duplicate notification.`);
        }
        
        return { 
          success: true, 
          details: "Skipped duplicate notification from same source", 
          isDuplicate: true 
        };
      }
      
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
    
    // Also cleanup source tracking
    for (const [src, msgMap] of notificationAttemptsBySource.entries()) {
      for (const [msgId, time] of msgMap.entries()) {
        if (now - time > 120000) { // 2 minutes
          msgMap.delete(msgId);
        }
      }
      if (msgMap.size === 0) {
        notificationAttemptsBySource.delete(src);
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
        triggerKeyword,
        forceSend, // Pass through the forceSend flag
        source     // Pass through the source
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
