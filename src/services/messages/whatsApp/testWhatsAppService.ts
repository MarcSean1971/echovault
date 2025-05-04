
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";
import { 
  getMessageRecipients, 
  getPhoneRecipient, 
  getMessageDetails, 
  handleWhatsAppError, 
  showWhatsAppSuccess 
} from './utils/whatsAppUtils';

/**
 * Send a test WhatsApp message to a recipient
 * @param messageId ID of the message to send test for
 * @returns Promise resolving to boolean indicating success
 */
export async function sendTestWhatsAppMessage(messageId: string): Promise<boolean> {
  try {
    // Get recipient details
    const { recipients, panicConfig, error: recipientsError } = await getMessageRecipients(messageId);
    if (recipientsError || !recipients) return false;
    
    // Find a recipient with a phone number
    const recipient = getPhoneRecipient(recipients);
    if (!recipient) return false;
    
    // Get message details
    const { message, error: messageError } = await getMessageDetails(messageId);
    if (messageError || !message) return false;

    // Extract the panic config to get keyword
    const triggerKeyword = panicConfig && 
                          typeof panicConfig === 'object' && 
                          panicConfig !== null ? 
                          (panicConfig as any).trigger_keyword || "SOS" : 
                          "SOS";
    
    // Send test WhatsApp message
    const { error } = await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: recipient.phone,
        message: `[TEST] "${message?.title}": This is a test WhatsApp message. In an emergency, send "${triggerKeyword}" to trigger this alert.`,
        recipientName: recipient.name,
        messageId: messageId
      }
    });
    
    if (error) throw error;
    
    // Show success message
    showWhatsAppSuccess(recipient);
    
    return true;
  } catch (error: any) {
    handleWhatsAppError(error, "sending test WhatsApp message");
    return false;
  }
}
