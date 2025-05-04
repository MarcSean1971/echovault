
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";

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
