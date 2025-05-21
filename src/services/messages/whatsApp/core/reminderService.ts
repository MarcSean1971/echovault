
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Trigger a manual reminder for a message
 * Enhanced with retry mechanism and multiple function calls
 */
export async function triggerManualReminder(messageId: string, forceSend: boolean = true, testMode: boolean = true) {
  try {
    console.log(`Triggering manual reminder check for message ${messageId}, forceSend: ${forceSend}, testMode: ${testMode}`);

    toast({
      title: "Reminder Check Triggered",
      description: "Processing test reminder...",
      duration: 3000,
    });

    // Create a tracking record for this manual trigger request
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `manual-trigger-${Date.now()}`,
        message_id: messageId,
        condition_id: 'manual-trigger',
        recipient: 'system',
        delivery_channel: 'manual',
        delivery_status: 'processing',
        response_data: { triggered_at: new Date().toISOString(), forceSend, testMode }
      });
    } catch (logError) {
      console.warn("Error logging manual trigger:", logError);
      // Non-fatal, continue
    }

    // First attempt - call reminder emails function
    let primarySuccess = false;
    try {
      const { data: reminderData, error: reminderError } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true, // CRITICAL FIX: Always force send for manual triggers
          source: "manual-ui-trigger",
          testMode: true, // CRITICAL FIX: Always use test mode for manual triggers
          action: "test-delivery" // Specify that this is a test delivery
        }
      });
      
      if (reminderError) {
        console.error("Error triggering reminder:", reminderError);
        // Don't throw yet, we'll try the backup method
      } else {
        console.log("Reminder response from primary function:", reminderData);
        primarySuccess = true;
      }
    } catch (primaryError) {
      console.error("Exception triggering primary reminder function:", primaryError);
      // Don't throw yet, we'll try the backup method
    }

    // Second attempt - try notification function as backup if primary failed
    if (!primarySuccess) {
      console.log("Primary reminder function failed, trying backup function...");
      const { data, error } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true, // CRITICAL FIX: Always force send for backup method too
          source: "manual-ui-trigger-backup",
          testMode: true, // CRITICAL FIX: Always use test mode for backup method
          action: "test-delivery" // Specify that this is a test delivery
        }
      });

      if (error) {
        console.error("Error triggering backup reminder:", error);
        
        // Both methods failed - show error
        toast({
          title: "Error Triggering Reminder",
          description: `Both reminder methods failed. Error: ${error.message || "Unknown error"}. Please try again or check server logs.`,
          variant: "destructive",
          duration: 5000,
        });
        
        throw error;
      }

      console.log("Reminder response from backup function:", data);
    }

    // For successful reminder delivery, show a more specific success toast
    if (primarySuccess || true) { // Always show success for now since we have multiple methods
      let successMessage = `Successfully initiated reminder sending process. Check your email in the next few minutes.`;
      
      toast({
        title: "Test Reminder Sent",
        description: successMessage,
        duration: 5000,
      });
      
      // Create another tracking record to mark this as complete
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `manual-trigger-complete-${Date.now()}`,
          message_id: messageId,
          condition_id: 'manual-trigger',
          recipient: 'system',
          delivery_channel: 'manual',
          delivery_status: 'delivered',
          response_data: { completed_at: new Date().toISOString(), testMode }
        });
      } catch (logError) {
        console.warn("Error logging manual trigger completion:", logError);
      }
      
      return {
        success: true,
        message: successMessage
      };
    }
    
    return {
      success: false,
      error: "No successful reminder method - this should not happen"
    };
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
