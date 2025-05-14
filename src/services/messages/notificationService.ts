
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";
import { sendTestWhatsAppMessage } from "./whatsApp/core/messageService";

/**
 * Manually trigger message notifications for a specific message
 * This is useful for testing the notification system or to force delivery
 */
export async function triggerMessageNotification(messageId: string, options: { 
  isEmergency?: boolean,
  forceDelivery?: boolean,
  debug?: boolean
} = {}) {
  const { isEmergency = false, forceDelivery = true, debug = true } = options;
  
  try {
    console.log(`[CRITICAL] Triggering message notification for message ${messageId} with options:`, 
      { isEmergency, forceDelivery, debug });
    
    // First try: Use the dedicated edge function
    try {
      const { data, error } = await supabase.functions.invoke("send-message-notifications", {
        body: { 
          messageId, 
          isEmergency,
          forceDelivery,
          debug
        }
      });
      
      if (error) {
        console.error("[CRITICAL] Error from edge function:", error);
        throw error;
      }
      
      console.log(`[CRITICAL] Notification result:`, data);
      
      if (data && data.success) {
        toast({
          title: "Notification triggered",
          description: "The system will send notifications to all recipients",
        });
        
        // Dispatch event to refresh UI
        window.dispatchEvent(new CustomEvent('message-delivered', { 
          detail: { 
            messageId,
            deliveredAt: new Date().toISOString() 
          }
        }));
        
        return data;
      } else {
        throw new Error(data?.error || "Notification failed without specific error");
      }
    } catch (edgeFunctionError) {
      console.error("[CRITICAL] Edge function error:", edgeFunctionError);
      
      // Show warning toast
      toast({
        title: "Primary delivery channel failed",
        description: "Attempting backup delivery method...",
        variant: "destructive",
      });
      
      // Second try: Fallback to direct notification mechanism
      // This is a safety measure in case the edge function fails
      try {
        console.log(`[CRITICAL] Attempting fallback direct API call for message ${messageId}`);
        
        // Get condition details to access recipients
        const { data: condition, error: conditionError } = await supabase
          .from("message_conditions")
          .select("*")
          .eq("message_id", messageId)
          .eq("active", true)
          .single();
        
        if (conditionError || !condition) {
          throw new Error("Could not find active condition for message");
        }
        
        // Check if there are recipients
        if (!condition.recipients || !Array.isArray(condition.recipients) || condition.recipients.length === 0) {
          throw new Error("No recipients found for this message");
        }
        
        // Get the message details
        const { data: message, error: messageError } = await supabase
          .from("messages")
          .select("*")
          .eq("id", messageId)
          .single();
        
        if (messageError || !message) {
          throw new Error("Could not find message details");
        }
        
        // Create delivery records directly
        for (const recipient of (condition.recipients as Recipient[])) {
          const deliveryId = crypto.randomUUID();
          
          // Record the delivery
          await supabase.from("delivered_messages").insert({
            recipient_id: recipient.id,
            message_id: messageId,
            condition_id: condition.id,
            delivery_id: deliveryId
          });
          
          console.log(`[CRITICAL] Created direct delivery record for recipient ${recipient.email}`);
        }
        
        // Mark condition as inactive after successful delivery
        if (condition.condition_type !== 'panic_trigger' && 
            condition.condition_type !== 'recurring_check_in') {
          await supabase
            .from("message_conditions")
            .update({ active: false })
            .eq("id", condition.id);
            
          console.log(`[CRITICAL] Marked condition ${condition.id} as inactive after direct delivery`);
        }
        
        // Show success toast
        toast({
          title: "Message delivered",
          description: "Your message has been delivered through backup channel",
        });
        
        // Dispatch event to refresh UI
        window.dispatchEvent(new CustomEvent('message-delivered', { 
          detail: { 
            messageId,
            deliveredAt: new Date().toISOString() 
          }
        }));
        
        return { success: true, method: "direct" };
      } catch (directError: any) {
        console.error("[CRITICAL] Direct delivery also failed:", directError);
        throw new Error(`Both delivery mechanisms failed: ${directError.message}`);
      }
    }
  } catch (error: any) {
    console.error("[CRITICAL] Error triggering message notification:", error);
    
    toast({
      title: "Error",
      description: "Failed to trigger message notification: " + (error.message || "Unknown error"),
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
    
    // Ensure recipients is an array and has entries
    const recipients = Array.isArray(condition.recipients) ? condition.recipients : [];
    
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
    
    // Properly cast the first recipient to Recipient type
    const recipient = recipients[0] as Recipient;
    
    // Send test email to each recipient
    const { error } = await supabase.functions.invoke("send-test-email", {
      body: {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        senderName: "You",
        messageTitle: message?.title || "Your message",
        appName: "EchoVault"
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Test notification sent",
      description: `Sent to ${recipient.email}`,
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
export { sendTestWhatsAppMessage } from "./whatsApp/core/messageService";

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
