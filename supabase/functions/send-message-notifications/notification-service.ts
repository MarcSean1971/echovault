
import {
  trackMessageNotification,
  recordMessageDelivery,
  updateConditionStatus,
  getPanicConfig
} from "./db-service.ts";
import { sendEmailToRecipient } from "./email-service.ts";
import { Message, Condition } from "./types.ts";

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
}

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
    
    // Determine security settings
    const hasPinCode = !!condition.pin_code;
    const hasDelayedAccess = (condition.unlock_delay_hours || 0) > 0;
    const hasExpiry = (condition.expiry_hours || 0) > 0;
    
    // Calculate dates for delay and expiry if applicable
    const now = new Date();
    const unlockDate = hasDelayedAccess 
      ? new Date(now.getTime() + (condition.unlock_delay_hours || 0) * 60 * 60 * 1000) 
      : now;
    const expiryDate = hasExpiry 
      ? new Date(now.getTime() + (condition.expiry_hours || 0) * 60 * 60 * 1000) 
      : null;
    
    // Create access link based on security settings
    const baseUrl = "https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1";
    
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
    
    // Send a notification to each recipient with retry for emergencies
    const recipientResults = await Promise.all(condition.recipients.map(async (recipient) => {
      let attempt = 0;
      let success = false;
      let error = null;
      
      // Create a unique delivery ID for this recipient
      const deliveryId = crypto.randomUUID();
      
      // Create secure access URL with delivery tracking
      const secureAccessUrl = `${baseUrl}/${message.id}?recipient=${encodeURIComponent(recipient.email)}&delivery=${deliveryId}`;
      
      if (debug) console.log(`Access URL for ${recipient.email}: ${secureAccessUrl}`);
      
      // Prepare common email data
      const emailData = {
        senderName: "EchoVault", // You could fetch the actual user's name here
        messageTitle: message.title,
        recipientName: recipient.name,
        messageType: message.message_type,
        hasPinCode: hasPinCode,
        hasDelayedAccess: hasDelayedAccess,
        hasExpiry: hasExpiry,
        unlockDate: hasDelayedAccess ? new Date(unlockDate).toISOString() : null,
        expiryDate: hasExpiry ? new Date(expiryDate!).toISOString() : null,
        accessUrl: secureAccessUrl,
        isEmergency: isEmergencyMessage
      };
      
      // Record the message delivery
      try {
        await recordMessageDelivery(message.id, condition.id, recipient.id, deliveryId);
        if (debug) console.log(`Successfully recorded delivery for message ${message.id} to recipient ${recipient.id}`);
      } catch (recordError) {
        console.error(`Error recording message delivery: ${recordError}`);
        // Continue despite record error - don't block email sending
      }
      
      // Try sending with retry for emergency messages
      while (!success && attempt < maxRetries) {
        try {
          if (debug) console.log(`Sending email to ${recipient.email} (attempt ${attempt + 1}/${maxRetries})`);
          
          // Send email notification
          const emailResult = await sendEmailToRecipient(recipient.email, emailData);
          
          if (debug) console.log(`Email sending result:`, emailResult);
          success = true;
        } catch (emailError: any) {
          attempt++;
          error = emailError;
          console.error(`Error sending email to ${recipient.email} (attempt ${attempt}):`, emailError);
          
          if (attempt < maxRetries) {
            // Only wait and retry if we have attempts remaining
            if (debug) console.log(`Retrying in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      return { 
        recipient: recipient.email,
        success, 
        attempts: attempt + 1,
        error: error ? error.message || "Unknown error" : null
      };
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
          // Check the panic_config for keep_armed setting
          const panicConfig = await getPanicConfig(condition.id);
          
          // Only deactivate if keep_armed is false or not specified
          const keepArmed = panicConfig?.keep_armed || false;
          
          if (debug) console.log(`Panic trigger - keep_armed setting is: ${keepArmed}`);
          
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
