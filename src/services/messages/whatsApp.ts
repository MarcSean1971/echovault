
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { triggerManualReminder as coreReminderTrigger } from "./whatsApp/core/reminderService";
import { getConditionByMessageId } from "./conditions/operations/get-operations";

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
        isEmergency: true,
        forceSend: true // Add forceSend parameter to ensure message is sent
      }
    });
    
    if (error) {
      console.error("Error triggering deadman's switch:", error);
      
      // If edge function fails, try direct database update as fallback
      try {
        // First get the condition ID for this message
        const condition = await getConditionByMessageId(messageId);
        
        if (!condition) {
          throw new Error("No condition found for this message");
        }
        
        // Use sent_reminders table as fallback with required condition_id
        await supabase.from("sent_reminders").insert({
          message_id: messageId,
          condition_id: condition.id, // Include condition_id from fetched condition
          deadline: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id || 'unknown'
        });
        
        toast({
          title: "Message queued for delivery",
          description: "Your message has been queued for delivery using fallback method. This may take a few minutes.",
          duration: 5000,
        });
        
        // Dispatch event to refresh the UI
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { updatedAt: new Date().toISOString() }
        }));
        
        return { success: true, details: { fallback: true } };
      } catch (fallbackError) {
        throw error; // If fallback fails, throw original error
      }
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
      } else if (data.success === false && data.error === "No messages found to notify") {
        // If no messages found, try the fallback method using sent_reminders
        try {
          // Get the condition ID first
          const condition = await getConditionByMessageId(messageId);
          
          if (!condition) {
            toast({
              title: "Delivery failed",
              description: "Could not find any conditions for this message",
              variant: "destructive",
              duration: 5000,
            });
            return { success: false, error: "No condition found for message" };
          }
          
          // Now include the condition_id in our insert
          await supabase.from("sent_reminders").insert({
            message_id: messageId,
            condition_id: condition.id,
            deadline: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id || 'unknown'
          });
          
          toast({
            title: "Message queued for delivery",
            description: "Your message has been queued for delivery using fallback mechanism.",
            duration: 5000,
          });
          
          return { success: true, details: { fallback: true } };
        } catch (fallbackError) {
          toast({
            title: "Delivery failed",
            description: "Failed to deliver message using both primary and fallback methods.",
            variant: "destructive",
            duration: 5000,
          });
          return { success: false, error: "Failed to deliver message using all available methods" };
        }
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
