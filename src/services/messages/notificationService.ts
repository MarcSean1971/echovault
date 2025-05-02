
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Manually trigger message notifications for a specific message
 * This is useful for testing the notification system
 */
export async function triggerMessageNotification(messageId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("send-message-notifications", {
      body: { messageId }
    });
    
    if (error) throw error;
    
    toast({
      title: "Notification triggered",
      description: "The system will send notifications to all recipients",
    });
    
    return data;
  } catch (error: any) {
    console.error("Error triggering message notification:", error);
    toast({
      title: "Error",
      description: "Failed to trigger message notification",
      variant: "destructive"
    });
    throw error;
  }
}

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
    
    const recipients = condition.recipients as any[];
    
    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("title")
      .eq("id", messageId)
      .single();
    
    if (messageError) throw messageError;
    
    // Send test email to each recipient
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
export async function sendTestWhatsAppMessage(messageId: string) {
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
    
    const recipients = condition.recipients as any[];
    
    // Get the first recipient with a phone number
    const recipient = recipients.find((r: any) => r.phone);
    
    if (!recipient || !recipient.phone) {
      toast({
        title: "No WhatsApp number",
        description: "The selected recipient doesn't have a phone number",
        variant: "destructive"
      });
      return;
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
    
    return data;
  } catch (error: any) {
    console.error("Error sending test WhatsApp message:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to send test WhatsApp message",
      variant: "destructive"
    });
    throw error;
  }
}
