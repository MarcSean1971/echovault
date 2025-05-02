
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
    // Use a more generic approach to query the table that's not in the TypeScript definitions
    const response = await supabase
      .from('sent_reminders')
      .select('*')
      .eq('message_id', messageId)
      .order('sent_at', { ascending: false });
      
    if (response.error) throw response.error;
    
    // Safely cast the response data to our defined Reminder interface
    return (response.data || []) as unknown as Reminder[];
  } catch (error: any) {
    console.error("Error fetching reminder history:", error);
    throw error;
  }
}
