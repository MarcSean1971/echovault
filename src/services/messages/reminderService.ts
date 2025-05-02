
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Manually trigger a reminder check for a specific message
 * This is useful for testing the reminder system
 */
export async function triggerReminderCheck(messageId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { messageId }
    });
    
    if (error) throw error;
    
    toast({
      title: "Reminder check triggered",
      description: "The system will check if a reminder needs to be sent",
    });
    
    return data;
  } catch (error: any) {
    console.error("Error triggering reminder check:", error);
    toast({
      title: "Error",
      description: "Failed to trigger reminder check",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Reminder interface representing the sent_reminders table structure
 */
export interface Reminder {
  id: string;
  condition_id: string;
  message_id: string;
  user_id: string;
  sent_at: string;
  deadline: string;
  created_at: string;
}

/**
 * Get reminder history for a specific message
 */
export async function getReminderHistory(messageId: string): Promise<Reminder[]> {
  try {
    // Use the RPC endpoint to bypass TypeScript's table type checking
    const { data, error } = await supabase.rpc('get_reminders_by_message_id', {
      p_message_id: messageId
    });
      
    if (error) {
      console.error("RPC error:", error);
      
      // Fallback to direct SQL query if RPC isn't available
      const response = await supabase.auth.getSession();
      const authToken = response.data.session?.access_token;
      
      // Build URL for direct query
      const url = `${supabase.supabaseUrl}/rest/v1/sent_reminders?message_id=eq.${messageId}&order=sent_at.desc`;
      
      const fetchResponse = await fetch(url, {
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP error: ${fetchResponse.status}`);
      }
      
      const fetchData = await fetchResponse.json();
      return (fetchData || []) as Reminder[];
    }
    
    return (data || []) as Reminder[];
  } catch (error: any) {
    console.error("Error fetching reminder history:", error);
    throw error;
  }
}
