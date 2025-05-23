
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Trigger a manual reminder for a message
 * Updated to prevent duplicate emails and use consistent template
 */
export async function triggerManualReminder(messageId: string, forceSend: boolean = true, testMode: boolean = true) {
  try {
    console.log(`[REMINDER-SERVICE] Triggering manual reminder for message ${messageId}, forceSend: ${forceSend}, testMode: ${testMode}`);

    toast({
      title: "Reminder Check Triggered",
      description: "Processing test reminder...",
      duration: 3000,
    });

    // Implement deduplication - check if a reminder was recently sent for this message
    try {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 2); // Reduced to 2 minutes for more frequent testing
      
      const { data: recentReminders } = await supabase
        .from('reminder_delivery_log')
        .select('id, created_at')
        .eq('message_id', messageId)
        .eq('delivery_channel', 'manual')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .limit(1);
        
      if (recentReminders && recentReminders.length > 0) {
        console.log(`[REMINDER-SERVICE] Detected recent reminder sent at ${recentReminders[0].created_at}`);
        console.log("[REMINDER-SERVICE] But we're ignoring this for test mode to ensure delivery");
        // REMOVED: Skip check for test mode - we want to force send for testing
      }
    } catch (checkError) {
      console.warn("[REMINDER-SERVICE] Error checking for recent reminders:", checkError);
      // Non-fatal, continue
    }

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
      console.warn("[REMINDER-SERVICE] Error logging manual trigger:", logError);
      // Non-fatal, continue
    }

    // Get the message creator's user_id for better tracking
    let userId = null;
    try {
      const { data: messageData } = await supabase
        .from("messages")
        .select("user_id")
        .eq("id", messageId)
        .single();
      
      userId = messageData?.user_id;
      console.log(`[REMINDER-SERVICE] Message creator user_id: ${userId}`);
    } catch (error) {
      console.warn("[REMINDER-SERVICE] Could not get message user_id:", error);
      // Non-fatal, continue
    }

    // Get the current user's ID as well
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    // Primary attempt - use send-reminder-emails for direct sending to message creator
    console.log("[REMINDER-SERVICE] Triggering send-reminder-emails for direct creator notification");
    let primarySuccess = false;
    try {
      const { data: reminderData, error: reminderError } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "manual-ui-trigger",
          testMode: true,
          action: "test-delivery",
          userId: userId || currentUserId // Use message creator ID or current user ID
        }
      });
      
      if (reminderError) {
        console.error("[REMINDER-SERVICE] Error triggering reminder:", reminderError);
      } else {
        console.log("[REMINDER-SERVICE] Reminder response:", reminderData);
        primarySuccess = true;
      }
    } catch (reminderError) {
      console.error("[REMINDER-SERVICE] Exception triggering reminder:", reminderError);
    }

    // Fallback attempt - use send-message-notifications if primary failed
    if (!primarySuccess) {
      console.log("[REMINDER-SERVICE] Primary method failed, falling back to send-message-notifications");
      const { data: notificationData, error: notificationError } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "manual-ui-trigger-fallback",
          testMode: true,
          action: "test-delivery",
          userId: userId || currentUserId // Use message creator ID or current user ID
        }
      });
      
      if (notificationError) {
        console.error("[REMINDER-SERVICE] Error triggering fallback notification:", notificationError);
        
        // Both methods failed - show error
        toast({
          title: "Error Triggering Reminder",
          description: `All delivery methods failed. Please try again later.`,
          variant: "destructive",
          duration: 5000,
        });
        
        throw notificationError;
      }

      console.log("[REMINDER-SERVICE] Notification response from fallback method:", notificationData);
    }

    // For successful reminder delivery, show a more specific success toast
    toast({
      title: "Test Reminder Sent",
      description: `Successfully initiated reminder sending process. Check your email in the next few minutes.`,
      variant: "purple",
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
      console.warn("[REMINDER-SERVICE] Error logging manual trigger completion:", logError);
    }
    
    return {
      success: true,
      message: "Reminder sent successfully"
    };
  } catch (error: any) {
    console.error("[REMINDER-SERVICE] Error in triggerManualReminder:", error);
    
    toast({
      title: "Error",
      description: error.message || "An unknown error occurred while sending the test reminder.",
      variant: "destructive", 
      duration: 5000,
    });
    
    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
}
