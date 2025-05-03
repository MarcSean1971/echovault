
import { supabaseClient } from "../supabase-client.ts";

/**
 * Send a WhatsApp notification for emergency messages
 */
export async function sendWhatsAppNotification(
  recipient: { phone?: string; name: string },
  message: { id: string; title: string; content: string | null },
  debug: boolean = false,
  isEmergency: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recipient.phone) {
      if (debug) console.log(`No phone number for recipient ${recipient.name}, skipping WhatsApp`);
      return { success: false, error: "No phone number provided" };
    }
    
    if (debug) console.log(`Sending WhatsApp message to ${recipient.phone}`);
    
    // Initialize Supabase client
    const supabase = supabaseClient();
    
    // Determine message content based on whether it's an emergency or reminder
    let whatsAppMessage = "";
    if (isEmergency) {
      whatsAppMessage = `⚠️ EMERGENCY ALERT: ${message.title}\n\n${message.content || "An emergency alert has been triggered for you."}\n\nCheck your email for more information.`;
    } else {
      whatsAppMessage = `🔔 REMINDER: ${message.title}\n\n${message.content || "A reminder has been sent regarding your message."}\n\nPlease check your email or log in to the system to take action.`;
    }
    
    // Call the WhatsApp notification function directly using the Supabase functions API
    const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: recipient.phone,
        message: whatsAppMessage,
        messageId: message.id,
        recipientName: recipient.name,
        isEmergency: isEmergency
      }
    });
    
    if (whatsAppError) {
      console.error(`WhatsApp sending error:`, whatsAppError);
      return { success: false, error: whatsAppError.message || "Unknown WhatsApp error" };
    }
    
    if (debug) console.log(`WhatsApp message sent successfully to ${recipient.phone}`);
    return { success: true };
    
  } catch (whatsAppError: any) {
    console.error(`Error sending WhatsApp message:`, whatsAppError);
    return { success: false, error: whatsAppError.message || "Unknown error" };
  }
}
