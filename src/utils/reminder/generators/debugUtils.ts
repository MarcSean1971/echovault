
/**
 * Debug/testing utilities for reminder schedule
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Debug/testing utility to check reminder schedule
 */
export async function inspectReminderSchedule(messageId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('*')
      .eq('message_id', messageId)
      .order('scheduled_at', { ascending: true });
      
    if (error) {
      console.error("[REMINDER-GENERATOR] Error inspecting reminder schedule:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("[REMINDER-GENERATOR] Error in inspectReminderSchedule:", error);
    return null;
  }
}
