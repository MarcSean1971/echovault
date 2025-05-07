
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Send a WhatsApp reminder for upcoming message triggering
 * @param messageId The ID of the message to send a reminder for
 * @param phone The recipient's phone number
 * @param message The reminder message text
 */
export async function sendWhatsAppReminder(
  messageId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!phone) {
      console.warn("No phone number provided for WhatsApp reminder");
      return { success: false, error: "No phone number provided" };
    }
    
    console.log(`Sending WhatsApp reminder to ${phone} for message ${messageId}`);
    
    // Format phone number to ensure proper format (remove whatsapp: prefix if it exists)
    const formattedPhone = phone.replace("whatsapp:", "");
    const cleanPhone = formattedPhone.startsWith('+') ? 
      formattedPhone : 
      `+${formattedPhone.replace(/\D/g, '')}`;
      
    // Call the WhatsApp notification function through Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: cleanPhone,
        message: message,
        messageId: messageId,
        isReminder: true
      }
    });
    
    if (error) {
      console.error("Error sending WhatsApp reminder:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendWhatsAppReminder:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Manually trigger reminders for a message
 * This is used for both email and WhatsApp reminders
 */
export async function triggerManualReminder(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Triggering manual reminder for message ${messageId}`);
    
    // Call the reminder edge function directly with debug flag
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId,
        debug: true, // Enable debug mode for more detailed logs
        forceSend: true // Force sending even if not due yet
      }
    });
    
    if (error) {
      console.error("Error triggering manual reminder:", error);
      toast({
        title: "Error",
        description: `Failed to trigger reminders: ${error.message}`,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
    
    // Log the full response for debugging
    console.log("Manual reminder response:", data);
    
    if (data && data.messages_processed === 0) {
      toast({
        title: "No reminders sent",
        description: "No reminders were sent. Check that the message has reminder hours configured and recipients set.",
        variant: "default",
      });
      return { success: false, error: "No messages processed" };
    }
    
    toast({
      title: "Reminders sent",
      description: data?.successful_reminders > 0 
        ? `Successfully sent ${data.successful_reminders} reminder(s)` 
        : "Reminder check triggered, but no messages were sent",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in triggerManualReminder:", error);
    
    // Show a more detailed error message
    toast({
      title: "Error",
      description: `Failed to trigger reminders: ${error.message || "Unknown error"}`,
      variant: "destructive",
    });
    
    return { success: false, error: error.message || "Unknown error" };
  }
}
