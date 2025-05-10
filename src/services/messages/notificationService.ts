import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";
import { sendTestWhatsAppMessage } from "./whatsApp";
import { Json } from "@/types/supabase";

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
    
    const recipientsArray = Array.isArray(condition.recipients) 
      ? (condition.recipients as Json[]).map(jsonToRecipient)
      : [];
    
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
        recipientName: recipientsArray[0].name,
        recipientEmail: recipientsArray[0].email,
        senderName: "You",
        messageTitle: message?.title || "Your message",
        appName: "EchoVault"
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Test notification sent",
      description: `Sent to ${recipientsArray[0].email}`,
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
export { sendTestWhatsAppMessage } from "./whatsApp";

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

// Add Json to Recipient conversion in the notification service
function jsonToRecipient(json: Json): Recipient {
  if (typeof json !== 'object' || json === null) {
    return {
      id: '',
      name: '',
      email: '',
    };
  }
  
  const obj = json as Record<string, any>;
  return {
    id: obj.id || '',
    name: obj.name || '',
    email: obj.email || '',
    phone: obj.phone,
    relationship: obj.relationship,
    notes: obj.notes,
    deliveryId: obj.deliveryId
  };
}
