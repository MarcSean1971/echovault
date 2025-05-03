
import { sendEmailNotification } from "../email-service.ts";
import { sendWhatsAppNotification } from "./whatsapp-service.ts";

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
  const { isEmergency = false, debug = false, maxRetries = 1, retryDelay = 5000, isWhatsAppEnabled = false, triggerKeyword = "" } = options;
  
  try {
    // Get user details
    const { data: sender, error: senderError } = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/profiles?id=eq.${message.user_id}&select=first_name,last_name`, {
      headers: {
        "Content-Type": "application/json",
        "apiKey": Deno.env.get("SUPABASE_ANON_KEY") || "",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""}`,
      },
    }).then(res => res.json());
    
    let senderName = "A user";
    if (!senderError && sender && sender.length > 0) {
      senderName = `${sender[0].first_name || ""} ${sender[0].last_name || ""}`.trim();
      if (!senderName) senderName = "A user";
    }
    
    // Send email notification with retries for emergency messages
    let emailSuccess = false;
    let emailError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0 && debug) {
        console.log(`Retry attempt ${attempt + 1} for email to ${recipient.email}`);
      }
      
      try {
        // Send email with location data if available
        const emailResult = await sendEmailNotification(
          message.id,
          recipient.email,
          recipient.name,
          senderName,
          message.title,
          message.content,
          {
            share_location: message.share_location,
            latitude: message.location_latitude,
            longitude: message.location_longitude,
            name: message.location_name
          },
          isEmergency
        );
        
        if (emailResult.success) {
          emailSuccess = true;
          break;
        } else {
          emailError = emailResult.error;
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
    
    if (isWhatsAppEnabled && recipient.phone) {
      try {
        const whatsAppResult = await sendWhatsAppNotification(
          recipient,
          message,
          debug,
          isEmergency
        );
        
        whatsAppSuccess = whatsAppResult.success;
        if (!whatsAppResult.success) {
          whatsAppError = whatsAppResult.error;
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
      email: { 
        success: emailSuccess, 
        error: emailError 
      },
      whatsapp: { 
        success: whatsAppSuccess, 
        error: whatsAppError, 
        enabled: isWhatsAppEnabled && !!recipient.phone
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
