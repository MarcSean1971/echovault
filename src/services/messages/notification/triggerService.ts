
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Manually trigger message notifications for a specific message
 * This is useful for testing the notification system
 */
export async function triggerMessageNotification(messageId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("send-message-notifications", {
      body: { 
        messageId,
        debug: true,
        forceSend: true, // Always force send when manually triggering
        source: 'manual_trigger'
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Notification triggered",
      description: "The system will send notifications to all recipients",
    });
    
    return data;
  } catch (error: any) {
    console.error("Error triggering message notification:", error);
    toast({
      title: "Error",
      description: "Failed to trigger message notification: " + error.message,
      variant: "destructive"
    });
    throw error;
  }
}
