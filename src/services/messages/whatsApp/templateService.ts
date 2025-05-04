
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
    
    // Use the template ID - Correct Content Template SID for the Conversations API
    const templateId = "HX4386568436c1f993dd47146448194dd8";
    
    // Prepare template parameters
    const templateParams = [
      senderName,            // Parameter 1: Sender name
      recipient.name,        // Parameter 2: Recipient name
      locationInfo,          // Parameter 3: Location
      mapUrl                 // Parameter 4: Map URL
    ];
    
    console.log("Sending template test with params:", JSON.stringify(templateParams, null, 2));
    
    // Call the WhatsApp notification function with template
    const { error } = await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: recipient.phone,
        useTemplate: true,
        templateId: templateId,
        templateParams: templateParams,
        messageId: messageId,
        recipientName: recipient.name,
        isEmergency: true
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Template Test Sent",
      description: "A test WhatsApp template message has been sent to " + recipient.name,
    });
    
    return true;
  } catch (error: any) {
    handleWhatsAppError(error, "sending template test");
    return false;
  }
}
