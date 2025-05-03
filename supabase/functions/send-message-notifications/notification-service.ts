
import {
  trackMessageNotification,
  recordMessageDelivery,
  updateConditionStatus,
  getPanicConfig
} from "./db-service.ts";
import { sendEmailNotification } from "./email-service.ts";
import { Message, Condition, EmailTemplateData } from "./types.ts";
import { supabaseClient } from "./supabase-client.ts";

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
}

/**
 * Generate a secure access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string): string {
  try {
    // Get the Supabase URL from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    // Construct the access URL with proper path and query parameters
    const accessUrl = `${supabaseUrl}/functions/v1/access-message?id=${messageId}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${deliveryId}`;
    
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    throw error;
  }
}

/**
 * Record a message delivery in the database
 */
export async function recordMessageDelivery(
  supabase: any,
  messageId: string, 
  recipientId: string,
  deliveryId: string
) {
  try {
    // Try to record the delivery in the delivered_messages table
    const { data, error } = await supabase
      .from("delivered_messages")
      .insert({
        message_id: messageId,
        recipient_id: recipientId,
        delivery_id: deliveryId,
        delivered_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist yet, log but continue
        console.error("Delivered messages table may not exist, skipping delivery recording");
        return null;
      }
      throw error;
    }
    
    console.log(`Successfully recorded delivery for message ${messageId} to recipient ${recipientId}`);
    return data[0];
  } catch (error) {
    console.error("Error recording message delivery:", error);
    // Non-critical error, continue with notification process
    return null;
  }
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
    
    // Initialize Supabase client for making function calls
    const supabase = supabaseClient();
    
    // Send a notification to each recipient with retry for emergencies
    const recipientResults = await Promise.all(condition.recipients.map(async (recipient) => {
      let attempt = 0;
      let success = false;
      let error = null;
      
      // Create a unique delivery ID for this recipient
      const deliveryId = crypto.randomUUID();
      
      // Create secure access URL with delivery tracking
      const secureAccessUrl = generateAccessUrl(message.id, recipient.email, deliveryId);
      
      if (debug) console.log(`Access URL for ${recipient.email}: ${secureAccessUrl}`);
      
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
        isEmergency: isEmergencyMessage
      };
      
      // Record the message delivery
      try {
        await recordMessageDelivery(supabase, message.id, recipient.id, deliveryId);
        if (debug) console.log(`Successfully recorded delivery for message ${message.id} to recipient ${recipient.id}`);
      } catch (recordError) {
        console.error(`Error recording message delivery: ${recordError}`);
        // Continue despite record error - don't block email sending
      }
      
      // Try sending email with retry for emergency messages
      while (!success && attempt < maxRetries) {
        try {
          if (debug) console.log(`Sending email to ${recipient.email} (attempt ${attempt + 1}/${maxRetries})`);
          
          // Send email notification - IMPORTANT: Updated to use the correct function name
          const emailResult = await sendEmailNotification(
            message.id,
            recipient.email,
            recipient.name,
            emailData.senderName,
            message.title,
            isEmergencyMessage
          );
          
          if (debug) console.log(`Email sending result:`, emailResult);
          success = true;
          
          // For emergency messages and WhatsApp enabled recipients, also send a WhatsApp message
          if (isEmergencyMessage && recipient.phone && (isWhatsAppEnabled || isEmergency)) {
            try {
              if (debug) console.log(`Sending WhatsApp message to ${recipient.phone}`);
              
              // Basic emergency message content
              const whatsAppMessage = `⚠️ EMERGENCY ALERT: ${message.title}\n\n${message.content || "An emergency alert has been triggered for you."}\n\nCheck your email for more information.`;
              
              // Call the WhatsApp notification function directly using the Supabase functions API
              const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp-notification", {
                body: {
                  to: recipient.phone,
                  message: whatsAppMessage,
                  messageId: message.id,
                  recipientName: recipient.name,
                  isEmergency: true
                }
              });
              
              if (whatsAppError) {
                console.error(`WhatsApp sending error:`, whatsAppError);
              } else {
                if (debug) console.log(`WhatsApp message sent successfully to ${recipient.phone}`);
              }
            } catch (whatsAppError) {
              console.error(`Error sending WhatsApp message:`, whatsAppError);
              // Continue despite WhatsApp error - we already sent the email
            }
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
