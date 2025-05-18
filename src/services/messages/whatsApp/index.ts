
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { triggerMessageNotification } from '../notificationService';

/**
 * Manually trigger a check for deadman switch and send reminder
 * 
 * @param messageId - The ID of the message to check
 * @returns Promise with result of the operation
 */
export async function triggerManualReminder(messageId: string) {
  try {
    console.log(`Manually triggering reminder for message ${messageId}`);
    
    // Call the reminder service edge function with forceSend=true to ensure it sends
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId,
        debug: true,
        forceSend: true
      }
    });
    
    if (error) {
      console.error("Error triggering reminder:", error);
      throw error;
    }
    
    if (data) {
      if (data.successful_reminders && data.successful_reminders > 0) {
        toast({
          title: "Reminder sent successfully",
          description: `Sent ${data.successful_reminders} reminder(s)`,
          duration: 5000,
        });
      } else {
        toast({
          title: "No reminders sent",
          description: data.message || "No reminders needed at this time",
          duration: 5000,
        });
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in triggerManualReminder:", error);
    toast({
      title: "Failed to send reminder",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
      duration: 5000,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Diagnose reminder system issues
 * This is a debugging utility
 */
export async function diagnoseReminderSystem(messageId: string) {
  try {
    console.log(`Running reminder system diagnostics for message ${messageId}`);
    
    // Check notification system status
    const statusResult = await supabase.functions.invoke("send-message-notifications/status", {});
    console.log("Notification system status:", statusResult.data);
    
    // Check trigger functionality
    let triggerStatus = 'Unknown';
    if (statusResult.data?.triggers) {
      triggerStatus = statusResult.data.triggers;
      console.log(`Trigger status: ${triggerStatus}`);
      console.log(`Trigger activity in last hour: ${statusResult.data.trigger_activity?.recent_hour || 0}`);
    }
    
    // Create a test reminder using the reminderService
    const testData = {
      messageId,
      debug: true,
      forceSend: true,
      action: 'diagnose'
    };
    
    // First try the reminder-emails function
    const reminderResult = await supabase.functions.invoke("send-reminder-emails", {
      body: testData
    });
    
    // Then try direct notification
    const notificationResult = await triggerMessageNotification(messageId);
    
    // Display results to the user
    toast({
      title: "Diagnostic Complete",
      description: `System status: ${statusResult.data?.status || 'Unknown'}, Triggers: ${triggerStatus}`,
      duration: 8000,
    });
    
    return {
      success: true,
      system_status: statusResult.data,
      reminder_test: reminderResult.data,
      notification_test: notificationResult
    };
  } catch (error: any) {
    console.error("Error in diagnoseReminderSystem:", error);
    toast({
      title: "Diagnostic Failed",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
      duration: 5000,
    });
    return { success: false, error: error.message };
  }
}

// Re-export the notification trigger function
export { triggerMessageNotification } from '../notificationService';
