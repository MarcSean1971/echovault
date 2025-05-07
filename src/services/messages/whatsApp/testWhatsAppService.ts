
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  getMessageRecipients,
  getPhoneRecipient,
  getMessageDetails,
  getSenderInfo,
  handleWhatsAppError,
  showWhatsAppSuccess
} from "./utils/whatsAppUtils";

/**
 * Send a test WhatsApp message
 * @param messageId ID of the message to test
 */
export async function sendTestWhatsAppMessage(messageId: string) {
  try {
    // Get necessary data
    const { recipients, panicConfig, error } = await getMessageRecipients(messageId);
    if (error || !recipients) return;

    // Find first recipient with phone number
    const recipient = getPhoneRecipient(recipients);
    if (!recipient) return;

    // Get message details
    const { message } = await getMessageDetails(messageId);
    if (!message) return;
    
    // Get sender info
    const { senderName } = await getSenderInfo();
    
    // Format message with test indicators
    const testMessage = `🧪 TEST MESSAGE from ${senderName}: ${message.title || "Test Message"}\n\nThis is a test of the emergency notification system. No action is required.`;
    
    // Send test message using our simplified function
    const { data, error: sendError } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: recipient.phone,
        message: testMessage
      }
    });
    
    if (sendError) {
      handleWhatsAppError(sendError, "sending test WhatsApp message");
      return;
    }
    
    console.log("Test WhatsApp message sent successfully:", data);
    showWhatsAppSuccess(recipient);
    
  } catch (error) {
    handleWhatsAppError(error, "sending test WhatsApp message");
  }
}

/**
 * Send a test WhatsApp SOS trigger
 * @param keyword The SOS keyword to test
 */
export async function testWhatsAppTrigger(keyword: string = "SOS") {
  try {
    // Get current user profile to get their phone number
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to test the WhatsApp trigger",
        variant: "destructive"
      });
      return;
    }
    
    // Get user's phone number from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("whatsapp_number")
      .eq("id", userData.user.id)
      .single();
      
    if (profileError || !profile?.whatsapp_number) {
      toast({
        title: "No WhatsApp number",
        description: "Please add your WhatsApp number to your profile first",
        variant: "destructive"
      });
      return;
    }
    
    // Directly call the webhook endpoint with a simulated message
    const { data, error: webhookError } = await supabase.functions.invoke("whatsapp-webhook", {
      body: {
        From: profile.whatsapp_number,
        Body: keyword
      }
    });
    
    if (webhookError) {
      console.error("Error testing WhatsApp trigger:", webhookError);
      toast({
        title: "Test failed",
        description: webhookError.message || "Could not test WhatsApp trigger",
        variant: "destructive"
      });
      return;
    }
    
    if (data?.matched) {
      toast({
        title: "SOS trigger test successful! ✅",
        description: "The emergency message trigger was recognized and processed",
      });
    } else {
      toast({
        title: "Test completed but no trigger matched",
        description: "The message was processed but no active panic messages were found",
        variant: "destructive"
      });
    }
    
    console.log("WhatsApp trigger test result:", data);
    
  } catch (error: any) {
    console.error("Error testing WhatsApp trigger:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to test WhatsApp trigger",
      variant: "destructive"
    });
  }
}
