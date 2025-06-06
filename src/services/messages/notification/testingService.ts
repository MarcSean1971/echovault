
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";
import { getSenderInfo } from './utils';

/**
 * Send a test notification to recipients
 */
export async function sendTestNotification(messageId: string) {
  try {
    // Get recipient details from the message condition
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("recipients")
      .eq("message_id", messageId)
      .single();
    
    if (conditionError || !condition) {
      toast({
        title: "No condition found",
        description: "Could not find condition for this message",
        variant: "destructive"
      });
      return;
    }
    
    if (!condition.recipients || !Array.isArray(condition.recipients) || condition.recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add recipients to this message first",
        variant: "destructive"
      });
      return;
    }
    
    // Properly cast the JSON data to our Recipient type
    const recipients = condition.recipients as unknown as Recipient[];
    
    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("title")
      .eq("id", messageId)
      .single();
    
    if (messageError) throw messageError;
    
    // Test by creating a manual reminder entry
    const { data: reminderData, error: reminderError } = await supabase.functions.invoke("send-reminder-emails", {
      body: {
        messageId,
        debug: true,
        forceSend: true,
        action: 'test',
        recipient: recipients[0].email
      }
    });
    
    if (reminderError) throw reminderError;
    
    // Send test email directly as well as a fallback
    const { error } = await supabase.functions.invoke("send-test-email", {
      body: {
        recipientName: recipients[0].name,
        recipientEmail: recipients[0].email,
        senderName: "You",
        messageTitle: message?.title || "Your message",
        appName: "EchoVault"
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Test notification sent",
      description: `Sent to ${recipients[0].email}`,
    });
    
    return reminderData;
    
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to send test notification",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Send a test WhatsApp message to recipient
 * This is used for testing WhatsApp integration
 */
export { sendTestWhatsAppMessage } from "../whatsApp/core/messageService";

/**
 * Test sending a WhatsApp template message
 */
export async function testWhatsAppTemplate(
  messageId: string,
  recipientId: string,
  templateId: string
) {
  try {
    // Implementation will be handled directly in the WhatsAppIntegration component
    // for simplicity, as it requires several API calls to gather the necessary data
    
    toast({
      title: "Testing template",
      description: "Preparing to send WhatsApp template message...",
    });
    
    return true;
  } catch (error: any) {
    console.error("Error testing WhatsApp template:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to test WhatsApp template",
      variant: "destructive"
    });
    throw error;
  }
}
