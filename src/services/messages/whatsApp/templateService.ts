
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  getMessageRecipients, 
  getPhoneRecipient, 
  getMessageDetails, 
  getSenderInfo, 
  formatLocationInfo, 
  handleWhatsAppError 
} from './utils/whatsAppUtils';

/**
 * Send a test WhatsApp template message
 * @param messageId ID of the message to send test template for
 * @returns Promise resolving to boolean indicating success
 */
export async function sendTestWhatsAppTemplate(messageId: string): Promise<boolean> {
  try {
    // Get recipient details
    const { recipients, error: recipientsError } = await getMessageRecipients(messageId);
    if (recipientsError || !recipients) return false;
    
    // Find a recipient with a phone number
    const recipient = getPhoneRecipient(recipients);
    if (!recipient) return false;
    
    // Get message data for location information
    const { message, error: messageError } = await getMessageDetails(messageId);
    if (messageError || !message) return false;
      
    // Get sender information
    const { senderName, error: senderError } = await getSenderInfo();
    if (senderError) return false;
    
    // Format location information
    const { locationInfo, mapUrl } = formatLocationInfo(message);
    
    console.log(`Sending WhatsApp template to ${recipient.phone} with location info: ${locationInfo}`);
    
    // Format phone number to ensure proper format (remove whatsapp: prefix if it exists)
    const formattedPhone = recipient.phone.startsWith('+') ? 
      recipient.phone : 
      `+${recipient.phone.replace(/\D/g, '')}`;
    
    // Use direct approach similar to the working example
    const { data, error } = await supabase.functions.invoke("send-whatsapp-alert", {
      body: {
        recipientPhone: formattedPhone,
        senderName: senderName,
        recipientName: recipient.name,
        locationText: locationInfo,
        locationLink: mapUrl
      }
    });
    
    if (error) {
      console.error("Error sending template:", error);
      throw error;
    }
    
    console.log("WhatsApp template response:", data);
    
    toast({
      title: "Template Test Sent",
      description: "A test WhatsApp template message has been sent to " + recipient.name,
    });
    
    return true;
  } catch (error: any) {
    console.error("Template test error:", error);
    handleWhatsAppError(error, "sending template test");
    return false;
  }
}
