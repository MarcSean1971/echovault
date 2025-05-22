
import { supabase } from "@/integrations/supabase/client";

/**
 * Check the status of the notification system
 */
export async function checkNotificationSystemStatus() {
  try {
    const { data, error } = await supabase.functions.invoke("send-message-notifications/status", {});
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    console.error("Error checking notification system status:", error);
    return {
      status: 'error',
      error: error.message || 'Unknown error'
    };
  }
}
