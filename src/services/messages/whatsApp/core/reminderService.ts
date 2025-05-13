
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Send a WhatsApp reminder for a message
 * Note: This is implemented in the edge function, and this is just a stub for typing
 */
export async function sendWhatsAppReminder(messageId: string) {
  // This is primarily implemented in the edge function
  // This function exists for proper typing in the frontend
  return {
    success: false,
    message: "WhatsApp reminders are processed in the Edge Function"
  };
}

/**
 * Trigger a manual reminder for a message
 */
export async function triggerManualReminder(messageId: string, forceSend: boolean = true) {
  try {
    console.log(`Triggering manual reminder check for message ${messageId}, forceSend: ${forceSend}`);

    toast({
      title: "Reminder Check Triggered",
      description: "Processing test reminder...",
      duration: 3000,
    });

    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: {
        messageId: messageId,
        debug: true,  // Enable debug mode for detailed logs
        forceSend: forceSend  // Force send even if not at reminder time
      }
    });

    if (error) {
      console.error("Error triggering reminder:", error);
      throw error;
    }

    if (data && data.successful_reminders > 0) {
      // Create a more specific success message based on the condition type
      let successMessage = `Successfully sent ${data.successful_reminders} reminder(s).`;
      
      // If this was a check-in condition, clarify that the reminder was sent to the creator
      if (data.condition_type && ['recurring_check_in', 'no_check_in', 'inactivity_to_date'].includes(data.condition_type)) {
        successMessage = `Successfully sent check-in reminder to message creator.`;
      }
      
      toast({
        title: "Test Reminder Sent",
        description: successMessage,
        duration: 5000,
      });
      
      return {
        success: true,
        message: successMessage,
        data
      };
    } else {
      // If we got a response but no successful reminders
      let errorMessage = "No reminders were sent. ";
      
      if (data && data.message) {
        errorMessage += data.message;
      } else if (data && data.results && data.results.length > 0) {
        // Check if there are any specific errors in the results
        const errors = data.results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
          errorMessage += errors[0]; // Just show the first error
        } else {
          errorMessage += "Check that the message has recipients and reminder settings configured.";
        }
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
    
    toast({
      title: "Error",
      description: error.message || "An unknown error occurred",
      variant: "destructive", 
      duration: 5000,
    });
    
    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
}
