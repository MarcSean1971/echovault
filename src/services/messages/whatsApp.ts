
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Trigger a manual reminder for a message
 * This is useful for testing the reminder system
 */
export async function triggerManualReminder(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Triggering manual reminder for message ${messageId}`);
    
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId: messageId, 
        forceSend: true,
        debug: true
      }
    });
    
    if (error) {
      console.error("Error triggering manual reminder:", error);
      throw error;
    }
    
    console.log("Manual reminder response:", data);
    
    if (data?.success) {
      toast({
        title: "Reminder sent successfully",
        description: `${data.successful_reminders || 0} reminder(s) delivered`,
        duration: 5000,
      });
      
      return { success: true };
    } else {
      const errorMessage = data?.message || data?.error || "No eligible reminders found";
      
      toast({
        title: "No reminders sent",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error("Error in triggerManualReminder:", error);
    
    toast({
      title: "Error sending reminder",
      description: error.message || "Something went wrong",
      variant: "destructive",
      duration: 5000,
    });
    
    return { success: false, error: error.message || "Unknown error" };
  }
}

// Re-export all needed WhatsApp functions from the core directory structure
export { sendTestWhatsAppMessage } from './whatsApp/core/messageService';
