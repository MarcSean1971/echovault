
/**
 * Basic utility functions for reminders
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Mark existing reminders as obsolete when creating new schedule
 */
export async function markExistingRemindersObsolete(messageId: string): Promise<boolean> {
  try {
    console.log(`[REMINDER-UTILS] Marking existing reminders as obsolete for message ${messageId}`);
    
    // CRITICAL FIX: Use message_id in the query to properly mark reminders as obsolete
    const { error, count } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    if (error) {
      // Check if this is an RLS permission error
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-UTILS] Permission denied marking reminders as obsolete - user likely doesn't own this message");
        return false;
      }
      
      console.error("[REMINDER-UTILS] Error marking reminders as obsolete:", error);
      return false;
    }
    
    console.log(`[REMINDER-UTILS] Marked ${count || 0} reminders as obsolete for message ${messageId}`);
    return true;
  } catch (error) {
    console.error("[REMINDER-UTILS] Error in markExistingRemindersObsolete:", error);
    return false;
  }
}
