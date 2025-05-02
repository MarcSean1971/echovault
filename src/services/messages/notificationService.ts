
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
    
    if (conditionError) throw conditionError;
    
    if (!condition || !condition.recipients) {
      toast({
        title: "No recipients",
        description: "Please add recipients to this message first",
        variant: "destructive"
      });
      return;
    }
    
    const recipients = condition.recipients as any[];
    
    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add recipients to this message first",
        variant: "destructive"
      });
      return;
    }
    
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
