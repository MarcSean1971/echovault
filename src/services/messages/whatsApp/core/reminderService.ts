
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Trigger a manual reminder for testing purposes
 * 
 * @param messageId Message ID to send reminders for
 * @param forceSend Whether to force send reminders even if not due
 * @param testMode Whether this is a test message
 * @returns Success status and any errors
 */
export async function triggerManualReminder(
  messageId: string, 
  forceSend: boolean = true, 
  testMode: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Triggering manual reminder for message ${messageId}`);
    console.log(`Force send: ${forceSend}, Test mode: ${testMode}`);
    
    // Show initial toast notification
    toast({
      title: "Sending test notification",
      description: "Hang tight while we send your notification...",
      duration: 3000,
    });
    
    // Attempt primary method first
    try {
      const { error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId,
          debug: true,
          forceSend,
          testMode,
          source: "manual-trigger",
          bypassDeduplication: true
        }
      });
      
      if (error) {
        console.error("Error invoking send-reminder-emails:", error);
        
        // Try backup method
        console.log("Trying backup method...");
        await supabase.functions.invoke("send-message-notifications", {
          body: {
            messageId, 
            debug: true,
            forceSend,
            testMode,
            source: "manual-trigger-backup",
            bypassDeduplication: true
          }
        });
      }
      
      console.log("Manual reminder triggered successfully");
      
      // Show success toast
      toast({
        title: "Test notification sent",
        description: "Check your email and WhatsApp for the notification.",
        duration: 5000,
      });
      
      return { success: true };
    } catch (primaryError) {
      console.error("Primary trigger method failed:", primaryError);
      
      // Try alternate last-resort approach
      try {
        console.log("Trying last-resort backup method...");
        const { data, error: backupError } = await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString() 
          })
          .eq('message_id', messageId)
          .eq('status', 'pending');
        
        if (backupError) {
          throw backupError;
        }
        
        // If we get here, at least the database was updated
        toast({
          title: "Test notification requested",
          description: "Your notification has been queued and will be processed shortly.",
          duration: 5000,
        });
        
        return { success: true };
      } catch (backupError) {
        console.error("All trigger methods failed:", backupError);
        
        // Show error toast
        toast({
          title: "Error sending test notification",
          description: "Failed to send test notification. Please try again later.",
          variant: "destructive",
          duration: 5000,
        });
        
        return { 
          success: false, 
          error: "All trigger methods failed. Try again in a few minutes." 
        };
      }
    }
  } catch (error: any) {
    console.error("Exception in triggerManualReminder:", error);
    
    // Show error toast
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
      duration: 5000,
    });
    
    return { 
      success: false, 
      error: error.message || "An unexpected error occurred" 
    };
  }
}
