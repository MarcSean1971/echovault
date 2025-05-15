
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
 * Trigger delivery of a deadman's switch message
 * This is a critical function that ensures message delivery when a deadline is reached
 * 
 * @param messageId - The ID of the message to deliver
 * @returns Promise with the result of the operation
 */
export async function triggerDeadmanSwitch(messageId: string) {
  try {
    console.log(`[CRITICAL] Triggering DEADMAN SWITCH for message ${messageId} at ${new Date().toISOString()}`);
    
    // Show toast to indicate the process has started
    toast({
      title: "Delivery in progress",
      description: "Processing message delivery...",
      duration: 5000,
    });
    
    // Track the start time for performance monitoring
    const startTime = Date.now();
    
    // Attempt to call the edge function with debug mode ON for more detailed logs
    const { data, error } = await supabase.functions.invoke("send-message-notifications", {
      body: { 
        messageId,
        debug: true,
        forceDelivery: true, // Add a force delivery flag
        keepArmed: false, // Ensure the message is disarmed after delivery
        triggeredBy: "deadman_switch", // Add source of trigger for logging
        timestamp: new Date().toISOString() // Add timestamp for logging
      }
    });
    
    // Log performance metrics
    const responseTime = Date.now() - startTime;
    console.log(`[CRITICAL] Response from send-message-notifications in ${responseTime}ms:`, data);
    
    if (error) {
      console.error(`[CRITICAL] Error triggering deadman switch for message ${messageId}:`, error);
      
      // FALLBACK: If the edge function call fails, attempt direct notification via API
      console.log(`[CRITICAL] Attempting fallback notification mechanism for message ${messageId}`);
      await triggerMessageNotification(messageId, {
        isEmergency: true,
        forceDelivery: true,
        debug: true
      });
      
      toast({
        title: "Error in primary delivery",
        description: "Attempting fallback delivery method...",
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    }
    
    if (!data || data.success === false) {
      console.error(`[CRITICAL] Deadman switch delivery failed for message ${messageId}:`, data?.error || 'Unknown error');
      
      // Show error toast
      toast({
        title: "Delivery failed",
        description: data?.error || "Failed to deliver message through primary channel. Attempting fallback...",
        variant: "destructive",
        duration: 5000,
      });
      
      // FALLBACK: If the edge function returns failure, try direct notification
      console.log(`[CRITICAL] Attempting fallback notification for failed delivery of message ${messageId}`);
      return await triggerMessageNotification(messageId, {
        isEmergency: true,
        forceDelivery: true,
        debug: true
      });
    }
    
    // Show success toast
    toast({
      title: "Message delivered",
      description: "Your message has been delivered to all recipients",
      duration: 5000,
    });
    
    // Dispatch an event to refresh the UI
    window.dispatchEvent(new CustomEvent('message-delivered', { 
      detail: { 
        messageId,
        deliveredAt: new Date().toISOString() 
      }
    }));
    
    return { success: true, data };
  } catch (error: any) {
    console.error(`[CRITICAL] Fatal error in triggerDeadmanSwitch for message ${messageId}:`, error);
    
    // Show critical error toast
    toast({
      title: "Critical delivery error",
      description: error.message || "Failed to deliver message after multiple attempts",
      variant: "destructive",
      duration: 8000, // Longer duration for critical errors
    });
    
    return { success: false, error: error.message };
  }
}

// Re-export the notification trigger function
export { triggerMessageNotification } from '../notificationService';
