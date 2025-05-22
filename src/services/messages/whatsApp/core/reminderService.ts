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
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const { data: recentReminders } = await supabase
        .from('reminder_delivery_log')
        .select('id, created_at')
        .eq('message_id', messageId)
        .eq('delivery_channel', 'manual')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .limit(1);
        
      if (recentReminders && recentReminders.length > 0) {
        console.log(`[REMINDER-SERVICE] Detected recent reminder sent at ${recentReminders[0].created_at}`);
        toast({
          title: "Reminder Already Triggered",
          description: "A reminder was recently sent. Please wait a few minutes before trying again.",
          variant: "purple",
          duration: 5000, 
        });
        return { success: true, message: "Reminder was recently sent" };
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

    // Primary attempt - use send-message-notifications for consistent template
    console.log("[REMINDER-SERVICE] Triggering send-message-notifications for consistent template");
    let primarySuccess = false;
    try {
      const { data: notificationData, error: notificationError } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "manual-ui-trigger",
          testMode: true,
          action: "test-delivery",
          userId: userId
        }
      });
      
      if (notificationError) {
        console.error("[REMINDER-SERVICE] Error triggering notification:", notificationError);
      } else {
        console.log("[REMINDER-SERVICE] Notification response:", notificationData);
        primarySuccess = true;
      }
    } catch (notificationError) {
      console.error("[REMINDER-SERVICE] Exception triggering notification:", notificationError);
    }

    // Fallback attempt - only if primary failed
    if (!primarySuccess) {
      console.log("[REMINDER-SERVICE] Primary method failed, falling back to send-reminder-emails");
      const { data: reminderData, error: reminderError } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "manual-ui-trigger-fallback",
          testMode: true,
          action: "test-delivery",
          userId: userId
        }
      });
      
      if (reminderError) {
        console.error("[REMINDER-SERVICE] Error triggering fallback reminder:", reminderError);
        
        // Both methods failed - show error
        toast({
          title: "Error Triggering Reminder",
          description: `All delivery methods failed. Please try again later.`,
          variant: "destructive",
          duration: 5000,
        });
        
        throw reminderError;
      }

      console.log("[REMINDER-SERVICE] Reminder response from fallback method:", reminderData);
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
