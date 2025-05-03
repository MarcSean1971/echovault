
import { Message, Condition, EmailTemplateData, Recipient } from "../types.ts";
import { sendEmailNotification } from "../email-service.ts";
import { supabaseClient } from "../supabase-client.ts";
import { recordMessageDelivery } from "../db-service.ts";
import { generateAccessUrl } from "../utils/url-generator.ts";
import { calculateDates } from "../utils/date-utils.ts";
import { sendWhatsAppNotification } from "./whatsapp-service.ts";

/**
 * Send notifications to a single recipient
 */
export async function notifyRecipient(
  recipient: Recipient,
  message: Message,
  condition: Condition,
  options: {
    isEmergency: boolean;
    debug: boolean;
    maxRetries: number;
    retryDelay: number;
    isWhatsAppEnabled: boolean;
    triggerKeyword: string;
  }
): Promise<{
  recipient: string;
  success: boolean;
  attempts: number;
  error: string | null;
}> {
  const { isEmergency, debug, maxRetries, retryDelay, isWhatsAppEnabled } = options;
  let attempt = 0;
  let success = false;
  let error = null;
  
  // Create a unique delivery ID for this recipient
  const deliveryId = crypto.randomUUID();
  
  // Create secure access URL with delivery tracking
  const secureAccessUrl = generateAccessUrl(message.id, recipient.email, deliveryId);
  
  if (debug) console.log(`Access URL for ${recipient.email}: ${secureAccessUrl}`);
  
  // Determine security settings
  const hasPinCode = !!condition.pin_code;
  const hasDelayedAccess = (condition.unlock_delay_hours || 0) > 0;
  const hasExpiry = (condition.expiry_hours || 0) > 0;
  
  // Calculate dates for delay and expiry if applicable
  const { unlockDate, expiryDate } = calculateDates(
    hasDelayedAccess, 
    hasExpiry,
    condition.unlock_delay_hours,
    condition.expiry_hours
  );
  
  // Prepare common email data
  const emailData: EmailTemplateData = {
    senderName: "EchoVault", // You could fetch the actual user's name here
    messageTitle: message.title,
    recipientName: recipient.name,
    messageType: message.message_type,
    hasPinCode,
    hasDelayedAccess,
    hasExpiry,
    unlockDate: hasDelayedAccess ? new Date(unlockDate).toISOString() : null,
    expiryDate: hasExpiry ? new Date(expiryDate!).toISOString() : null,
    accessUrl: secureAccessUrl,
    isEmergency: isEmergency
  };
  
  // Initialize Supabase client for making function calls
  const supabase = supabaseClient();
  
  // Record the message delivery
  try {
    await recordMessageDelivery(message.id, condition.id, recipient.id, deliveryId);
    if (debug) console.log(`Successfully recorded delivery for message ${message.id} to recipient ${recipient.id}`);
  } catch (recordError) {
    console.error(`Error recording message delivery: ${recordError}`);
    // Continue despite record error - don't block email sending
  }
  
  // Try sending email with retry for emergency messages
  while (!success && attempt < maxRetries) {
    try {
      if (debug) console.log(`Sending email to ${recipient.email} (attempt ${attempt + 1}/${maxRetries})`);
      
      // Send email notification
      const emailResult = await sendEmailNotification(
        message.id,
        recipient.email,
        recipient.name,
        emailData.senderName,
        message.title,
        isEmergency
      );
      
      if (debug) console.log(`Email sending result:`, emailResult);
      success = true;
      
      // For emergency messages and WhatsApp enabled recipients, also send a WhatsApp message
      if (isEmergency && recipient.phone && (isWhatsAppEnabled || isEmergency)) {
        await sendWhatsAppNotification(recipient, message, debug);
      }
      
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
}
