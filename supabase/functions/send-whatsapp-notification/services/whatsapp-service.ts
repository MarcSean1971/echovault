
import { supabaseClient } from "../supabase-client.ts";

/**
 * Send a WhatsApp notification for emergency messages
 */
export async function sendWhatsAppNotification(
  recipient: { phone?: string; name: string },
  message: { 
    id: string; 
    title: string; 
    content: string | null;
    share_location?: boolean;
    location_latitude?: number | null;
    location_longitude?: number | null;
    location_name?: string | null;
    user_id: string;
  },
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
    
    // Get sender name from profiles table
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', message.user_id)
      .single();
    
    // Create sender name
    let senderName = "Someone";
    if (!senderError && sender) {
      senderName = `${sender.first_name || ""} ${sender.last_name || ""}`.trim();
      if (!senderName) senderName = "Someone";
      if (debug) console.log(`Found sender name: ${senderName}`);
    } else if (debug) {
      console.log(`Could not retrieve sender name: ${senderError?.message || "Unknown error"}`);
    }
    
    // Format location information if available
    let locationText = "";
    let locationLink = "";
    
    if (message.share_location && message.location_latitude && message.location_longitude) {
      locationText = message.location_name || `${message.location_latitude}, ${message.location_longitude}`;
      locationLink = `https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`;
    }
    
    // Format phone number to ensure proper format (remove whatsapp: prefix if it exists)
    const formattedPhone = recipient.phone.replace("whatsapp:", "");
    const cleanPhone = formattedPhone.startsWith('+') ? 
      formattedPhone : 
      `+${formattedPhone.replace(/\D/g, '')}`;
    
    // Use template for emergency messages with simplified approach
    if (isEmergency) {
      if (debug) console.log("Using WhatsApp template for emergency message");
      
      // Call the new simplified WhatsApp alert function
      const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp-alert", {
        body: {
          recipientPhone: cleanPhone,
          senderName: senderName,
          recipientName: recipient.name,
          locationText: locationText || "Unknown location",
          locationLink: locationLink || "No map link available"
        }
      });
      
      if (whatsAppError) {
        console.error(`WhatsApp template sending error:`, whatsAppError);
        return { success: false, error: whatsAppError.message || "Unknown WhatsApp error" };
      }
      
      if (debug) console.log(`WhatsApp template message sent successfully to ${cleanPhone}`);
      return { success: true };
    } else {
      // For non-emergency messages, use standard text messages
      const whatsAppMessage = `🔔 REMINDER FROM ${senderName}: ${message.title}\n\n${message.content || "A reminder has been sent regarding your message."}\n\nPlease check your email or log in to the system to take action.`;
      
      // Call the WhatsApp notification function directly using the Supabase functions API
      const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: cleanPhone,
          message: whatsAppMessage
        }
      });
      
      if (whatsAppError) {
        console.error(`WhatsApp sending error:`, whatsAppError);
        return { success: false, error: whatsAppError.message || "Unknown WhatsApp error" };
      }
      
      if (debug) console.log(`WhatsApp message sent successfully to ${cleanPhone}`);
      return { success: true };
    }
    
  } catch (whatsAppError: any) {
    console.error(`Error sending WhatsApp message:`, whatsAppError);
    return { success: false, error: whatsAppError.message || "Unknown error" };
  }
}
