
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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

// Re-export the notification trigger function
export { triggerMessageNotification } from '../notificationService';

/**
 * Manually force trigger the deadman's switch to deliver messages now
 * 
 * @param messageId - The ID of the message to deliver
 * @returns Promise with result of the operation
 */
export async function triggerDeadmanSwitch(messageId: string) {
  try {
    console.log(`Manually triggering deadman's switch for message ${messageId}`);
    
    // Call the notification service edge function with isEmergency=true to bypass checks
    const { data, error } = await supabase.functions.invoke("send-message-notifications", {
      body: { 
        messageId,
        debug: true,
        isEmergency: true
      }
    });
    
    if (error) {
      console.error("Error triggering deadman's switch:", error);
      throw error;
    }
    
    if (data) {
      if (data.successful_notifications && data.successful_notifications > 0) {
        toast({
          title: "Message delivered",
          description: "Your message has been delivered to recipients",
          duration: 5000,
        });
        
        // Dispatch event to refresh the UI
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { updatedAt: new Date().toISOString() }
        }));
        
        return { success: true, details: data };
      } else {
        toast({
          title: "Delivery failed",
          description: data.error || "Failed to deliver message",
          variant: "destructive",
          duration: 5000,
        });
        return { success: false, error: data.error || "Failed to deliver message" };
      }
    }
    
    return { success: false, error: "No response from delivery service" };
  } catch (error: any) {
    console.error("Error in triggerDeadmanSwitch:", error);
    toast({
      title: "Failed to deliver message",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
      duration: 5000,
    });
    return { success: false, error: error.message };
  }
}
