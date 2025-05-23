
import { sendEmailNotification } from "../email-service.ts";
import { sendWhatsAppNotification } from "./whatsapp-service.ts";
import { supabaseClient } from "../supabase-client.ts";

interface NotificationOptions {
  isEmergency?: boolean;
  debug?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  isWhatsAppEnabled?: boolean;
  triggerKeyword?: string;
}

/**
 * Notify a single recipient about a message
 */
export async function notifyRecipient(
  recipient: any, 
  message: any, 
  condition: any, 
  options: NotificationOptions = {}
) {
  const { 
    isEmergency = false, 
    debug = false, 
    maxRetries = 1, 
    retryDelay = 5000, 
    isWhatsAppEnabled = false, 
    triggerKeyword = "" 
  } = options;
  
  try {
    // Initialize Supabase client for reliable data access
    const supabase = supabaseClient();
    
    // Get user details using Supabase client instead of direct fetch
    const { data: senderData, error: senderError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", message.user_id)
      .single();
    
    // Build sender name with better fallback handling
    let senderName = "A user";
    if (!senderError && senderData) {
      const firstName = senderData.first_name || "";
      const lastName = senderData.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();
      senderName = fullName || "A user";
      
      if (debug) {
        console.log(`Retrieved sender name: "${senderName}" for user ID ${message.user_id}`);
      }
    } else if (debug) {
      console.error(`Error retrieving sender profile: ${senderError?.message || "Unknown error"}`);
    }
    
    // Send email notification with retries for emergency messages
    let emailSuccess = false;
    let emailError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0 && debug) {
        console.log(`Retry attempt ${attempt + 1} for email to ${recipient.email}`);
      }
      
      try {
        // Use the pre-generated deliveryId if available
        const deliveryId = recipient.deliveryId || undefined;
        if (deliveryId && debug) {
          console.log(`Using pre-generated delivery ID ${deliveryId} for ${recipient.email}`);
        }
        
        // Send email with location data and attachments if available
        const emailResult = await sendEmailNotification(
          message.id,
          recipient.email,
          recipient.name,
          senderName,
          message.title,
          message.text_content || message.content, // Use text_content field if available
          {
            share_location: message.share_location,
            latitude: message.location_latitude,
            longitude: message.location_longitude,
            name: message.location_name
          },
          isEmergency || condition.condition_type === "no_check_in", // Treat deadman's switch as emergency
          "EchoVault",  // App name
          deliveryId,   // Pass the deliveryId to the email service
          message.attachments // Pass message attachments to email service
        );
        
        if (emailResult.success) {
          emailSuccess = true;
          if (debug) {
            console.log(`Email sent successfully to ${recipient.email} for message ${message.id}`);
          }
          break;
        } else {
          emailError = emailResult.error;
          if (debug) {
            console.error(`Email delivery failed to ${recipient.email}: ${emailResult.error}`);
          }
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, retryDelay));
          }
        }
      } catch (err) {
        emailError = err;
        if (debug) console.error(`Email delivery attempt ${attempt + 1} failed:`, err);
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, retryDelay));
        }
      }
    }
    
    // Send WhatsApp notification if enabled and recipient has a phone
    let whatsAppSuccess = false;
    let whatsAppError = null;
    
    if ((isWhatsAppEnabled || condition.panic_config?.methods?.includes('whatsapp')) && recipient.phone) {
      try {
        if (debug) {
          console.log(`Attempting WhatsApp delivery to ${recipient.phone} for message ${message.id}`);
        }
        
        const whatsAppResult = await sendWhatsAppNotification(
          recipient,
          message,
          debug,
          isEmergency || condition.condition_type === "no_check_in" // Treat deadman's switch as emergency
        );
        
        whatsAppSuccess = whatsAppResult.success;
        if (!whatsAppResult.success) {
          whatsAppError = whatsAppResult.error;
          if (debug) {
            console.error(`WhatsApp delivery failed to ${recipient.phone}: ${whatsAppResult.error}`);
          }
        } else if (debug) {
          console.log(`WhatsApp sent successfully to ${recipient.phone} for message ${message.id}`);
        }
      } catch (err) {
        whatsAppError = err;
        if (debug) console.error(`WhatsApp delivery failed:`, err);
      }
    }
    
    // Return results
    return {
      success: emailSuccess || whatsAppSuccess,
      recipient: recipient.email,
      deliveryId: recipient.deliveryId,  // Include the deliveryId in the result
      email: { 
        success: emailSuccess, 
        error: emailError 
      },
      whatsapp: { 
        success: whatsAppSuccess, 
        error: whatsAppError, 
        enabled: isWhatsAppEnabled || condition.panic_config?.methods?.includes('whatsapp')
      }
    };
  } catch (error) {
    console.error(`Error notifying recipient ${recipient.email}:`, error);
    return {
      success: false,
      recipient: recipient.email,
      error: error.message || "Unknown error"
    };
  }
}
