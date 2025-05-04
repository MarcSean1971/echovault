
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";

/**
 * Send a test WhatsApp message to a recipient
 */
export async function sendTestWhatsAppMessage(messageId: string): Promise<boolean> {
  try {
    // Get recipient details from the message condition
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("recipients, panic_config")
      .eq("message_id", messageId)
      .single();
    
    if (conditionError || !condition) {
      toast({
        title: "No condition found",
        description: "Could not find condition for this message",
        variant: "destructive"
      });
      return false;
    }
    
    // Type checking to ensure recipients is an array before using array methods
    const recipients = condition.recipients;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add recipients to this message first",
        variant: "destructive"
      });
      return false;
    }
    
    // Cast to proper type for type safety
    const typedRecipients = recipients as Recipient[];
    
    // Safely use find after confirming recipients is an array
    const recipient = typedRecipients.find(r => r.phone);
    
    if (!recipient || !recipient.phone) {
      toast({
        title: "No WhatsApp number",
        description: "The selected recipient doesn't have a phone number",
        variant: "destructive"
      });
      return false;
    }
    
    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("title, content")
      .eq("id", messageId)
      .single();
    
    if (messageError) throw messageError;

    // Extract the panic config to get keyword
    const panicConfig = condition.panic_config;
    // Safely access trigger_keyword with type checking
    const triggerKeyword = panicConfig && 
                          typeof panicConfig === 'object' && 
                          panicConfig !== null ? 
                          (panicConfig as any).trigger_keyword || "SOS" : 
                          "SOS";
    
    // Send test WhatsApp message
    const { data, error } = await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: recipient.phone,
        message: `[TEST] "${message?.title}": This is a test WhatsApp message. In an emergency, send "${triggerKeyword}" to trigger this alert.`,
        recipientName: recipient.name,
        messageId: messageId
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Test WhatsApp message sent",
      description: `Sent to ${recipient.phone}`,
    });
    
    return true;
  } catch (error: any) {
    console.error("Error sending test WhatsApp message:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to send test WhatsApp message",
      variant: "destructive"
    });
    return false;
  }
}
