
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
    user_id: string;  // Add user_id to retrieve sender name
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
    
    // Check if location should be included
    const includeLocation = message.share_location === true && 
                         message.location_latitude !== null && 
                         message.location_longitude !== null;
    
    // Format location information if available
    let locationInfo = "";
    let mapUrl = "";
    
    if (includeLocation) {
      const locationName = message.location_name ? 
        `${message.location_name}` : 
        `${message.location_latitude}, ${message.location_longitude}`;
        
      locationInfo = locationName;
      mapUrl = `https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`;
    }
    
    // Determine if we should use template or regular message
    const useTemplate = isEmergency; // For now, we only use templates for emergency messages
    const emergencyTemplateId = "test_emergency_alert_hx4386568436c1f993dd47146448194dd8"; // This is the Facebook reference ID for the approved template
    
    if (useTemplate && isEmergency) {
      if (debug) console.log(`Using WhatsApp template for emergency message: ${emergencyTemplateId}`);
      
      // Prepare template parameters
      // {{1}} - Sender name
      // {{2}} - Recipient name
      // {{3}} - Location
      // {{4}} - Map URL
      const templateParams = [
        senderName,                   // Parameter 1: Sender name
        recipient.name,               // Parameter 2: Recipient name
        locationInfo || "Unknown",    // Parameter 3: Location info
        mapUrl || "Not available"     // Parameter 4: Map URL
      ];
      
      if (debug) {
        console.log(`Template params: ${JSON.stringify(templateParams)}`);
      }
      
      // Call the WhatsApp notification function with template information
      const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: recipient.phone,
          useTemplate: true,
          templateId: emergencyTemplateId,
          templateParams: templateParams,
          messageId: message.id,
          recipientName: recipient.name,
          isEmergency: isEmergency
        }
      });
      
      if (whatsAppError) {
        console.error(`WhatsApp template sending error:`, whatsAppError);
        return { success: false, error: whatsAppError.message || "Unknown WhatsApp error" };
      }
      
      if (debug) console.log(`WhatsApp template message sent successfully to ${recipient.phone}`);
      return { success: true };
      
    } else {
      // Fallback to the original text-based message if not using templates
      // Determine message content based on whether it's an emergency or reminder
      let whatsAppMessage = "";
      if (isEmergency) {
        whatsAppMessage = `⚠️ EMERGENCY ALERT FROM ${senderName.toUpperCase()}: ${message.title}\n\n${message.content || "An emergency alert has been triggered."}\n${senderName} needs help!${locationInfo ? `\n\n📍 ${locationInfo}\n📲 Maps: ${mapUrl}` : ""}\n\nCheck your email for more information.`;
      } else {
        whatsAppMessage = `🔔 REMINDER FROM ${senderName}: ${message.title}\n\n${message.content || "A reminder has been sent regarding your message."}\n\nPlease check your email or log in to the system to take action.`;
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
    }
    
  } catch (whatsAppError: any) {
    console.error(`Error sending WhatsApp message:`, whatsAppError);
    return { success: false, error: whatsAppError.message || "Unknown error" };
  }
}
