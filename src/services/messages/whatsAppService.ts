
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

/**
 * Send a test WhatsApp template message
 */
export async function sendTestWhatsAppTemplate(messageId: string): Promise<boolean> {
  try {
    // Get the first recipient with a phone number
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("recipients")
      .eq("message_id", messageId)
      .single();
    
    if (conditionError) throw conditionError;
    
    // Properly type-check the recipients before using find()
    const recipients = condition?.recipients;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add recipients to test the template.",
        variant: "destructive"
      });
      return false;
    }
    
    // Cast the recipients array to the Recipient type to ensure type safety
    const typedRecipients = recipients as Recipient[];
    
    // Now we can safely use find() since we've confirmed recipients is an array and cast the type
    const recipient = typedRecipients.find(r => r.phone);
    
    if (!recipient || !recipient.phone) {
      toast({
        title: "No WhatsApp Number",
        description: "Please add a recipient with a phone number to test the template.",
        variant: "destructive"
      });
      return false;
    }
    
    // Get message data for location information
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("title, share_location, location_latitude, location_longitude, location_name")
      .eq("id", messageId)
      .single();
      
    if (messageError) throw messageError;
    
    // Get the user's profile for sender information
    const { data: profile, error: profileError } = await supabase.auth.getUser();
    
    if (profileError) throw profileError;
    
    const userId = profile?.user?.id;
    
    if (!userId) throw new Error("User not authenticated");
    
    const { data: userData, error: userDataError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();
      
    if (userDataError) throw userDataError;
    
    // Format location information
    let locationInfo = "Test location";
    let mapUrl = "https://maps.example.com";
    
    if (message?.share_location && message?.location_latitude && message?.location_longitude) {
      locationInfo = message.location_name || `${message.location_latitude}, ${message.location_longitude}`;
      mapUrl = `https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`;
    }
    
    // Format sender name
    const senderName = `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim() || "You";
    
    // Use the template ID
    const templateId = "test_emergency_alert_hx4386568436c1f993dd47146448194dd8";
    
    // Prepare template parameters
    const templateParams = [
      senderName,            // Parameter 1: Sender name
      recipient.name,        // Parameter 2: Recipient name
      locationInfo,          // Parameter 3: Location
      mapUrl                 // Parameter 4: Map URL
    ];
    
    // Call the WhatsApp notification function with template
    const { data, error } = await supabase.functions.invoke("send-whatsapp-notification", {
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
    console.error("Error sending template test:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to send template test",
      variant: "destructive"
    });
    return false;
  }
}
