import {
  trackMessageNotification,
  recordMessageDelivery,
  updateConditionStatus,
  getPanicConfig
} from "./db-service.ts";
import { sendEmailToRecipient } from "./email-service.ts";
import { Message, Condition } from "./types.ts";

export async function sendMessageNotification(data: {message: Message, condition: Condition}) {
  const { message, condition } = data;
  
  // Skip if no recipients
  if (!condition.recipients || condition.recipients.length === 0) {
    console.log(`No recipients for message ${message.id}, skipping notification`);
    return { success: true, message: "No recipients to notify" };
  }
  
  try {
    // Check if this is an emergency/panic message for special handling
    const isEmergencyMessage = condition.condition_type === 'panic_trigger';
    
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
    await trackMessageNotification(message.id, condition.id);
    
    // For emergency messages, attempt multiple deliveries with retry
    const maxRetries = isEmergencyMessage ? 3 : 1;
    const retryDelay = 5000; // 5 seconds between retries for emergency messages
    
    // Send a notification to each recipient with retry for emergencies
    await Promise.all(condition.recipients.map(async (recipient) => {
      let attempt = 0;
      let success = false;
      
      // Create a unique delivery ID for this recipient
      const deliveryId = crypto.randomUUID();
      
      // Create secure access URL with delivery tracking
      const secureAccessUrl = `${baseUrl}/${message.id}?recipient=${encodeURIComponent(recipient.email)}&delivery=${deliveryId}`;
      
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
      await recordMessageDelivery(message.id, condition.id, recipient.id, deliveryId);
      
      // Try sending with retry for emergency messages
      while (!success && attempt < maxRetries) {
        try {
          // Send email notification
          await sendEmailToRecipient(recipient.email, emailData);
          success = true;
        } catch (error) {
          attempt++;
          console.error(`Error sending email to ${recipient.email} (attempt ${attempt}):`, error);
          if (attempt < maxRetries) {
            // Only wait and retry if we have attempts remaining
            console.log(`Retrying in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      return success;
    }));
    
    // Only mark the condition as inactive if it's not a recurring trigger or special case
    if (condition.condition_type !== 'recurring_check_in') {
      // For panic triggers, we need to check if keep_armed is true
      if (condition.condition_type === 'panic_trigger') {
        const panicConfig = await getPanicConfig(condition.id);
        
        // Only deactivate if keep_armed is false or not specified
        const keepArmed = panicConfig?.keep_armed || false;
        
        if (!keepArmed) {
          // Deactivate the condition
          await updateConditionStatus(condition.id, false);
        }
      } else {
        // For all other non-recurring conditions, mark as inactive after delivery
        await updateConditionStatus(condition.id, false);
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error notifying recipients for message ${message.id}:`, error);
    return { success: false, error: error.message };
  }
}
