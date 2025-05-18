import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { triggerManualReminder as coreReminderTrigger } from "./whatsApp/core/reminderService";

/**
 * Trigger a manual reminder for a message
 * This is useful for testing the reminder system
 * Updated to forward parameters to the core function
 */
export async function triggerManualReminder(messageId: string, forceSend: boolean = true, testMode: boolean = false): Promise<{ success: boolean; error?: string }> {
  // Forward the call to the core implementation with all parameters
  return coreReminderTrigger(messageId, forceSend, testMode);
}

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

// Re-export all needed WhatsApp functions from the core directory structure
export { sendTestWhatsAppMessage } from './whatsApp/core/messageService';
// Remove the circular reference: export { triggerDeadmanSwitch } from './whatsApp';
