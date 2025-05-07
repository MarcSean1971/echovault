
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Trigger a manual reminder for a message
 */
export async function triggerManualReminder(messageId: string) {
  try {
    console.log(`Triggering manual reminder check for message ${messageId}`);

    toast({
      title: "Reminder Check Triggered",
      description: "Processing test reminder...",
      duration: 3000,
    });

    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: {
        messageId: messageId,
        debug: true,  // Enable debug mode for detailed logs
        forceSend: true  // Force send even if not at reminder time
      }
    });

    if (error) {
      console.error("Error triggering reminder:", error);
      throw error;
    }

    if (data && data.successful_reminders > 0) {
      toast({
        title: "Test Reminder Sent",
        description: `Successfully sent ${data.successful_reminders} reminder(s).`,
        duration: 5000,
      });
      return {
        success: true,
        message: `Successfully sent ${data.successful_reminders} reminder(s)`,
        data
      };
    } else {
      // If we got a response but no successful reminders
      let errorMessage = "No reminders were sent. ";
      
      if (data && data.message) {
        errorMessage += data.message;
      } else {
        errorMessage += "Check that the message has recipients and reminder settings configured.";
      }

      toast({
        title: "No reminders sent",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      return {
        success: false,
        error: errorMessage,
        data
      };
    }
  } catch (error: any) {
    console.error("Error in triggerManualReminder:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
}
