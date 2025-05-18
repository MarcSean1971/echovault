
/**
 * Utility functions for the reminder service
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Mark existing reminders as obsolete
 * Updated to handle RLS permissions
 */
export async function markRemindersAsObsolete(messageId: string, conditionId: string): Promise<boolean> {
  try {
    console.log(`[REMINDER-SERVICE] Marking existing reminders as obsolete for message ${messageId}, condition ${conditionId}`);
    
    const { error } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId)
      .eq('condition_id', conditionId);
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SERVICE] Permission denied marking reminders as obsolete - user likely doesn't own this message");
      } else {
        console.error("[REMINDER-SERVICE] Error marking reminders as obsolete:", error);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in markExistingRemindersObsolete:", error);
    return false;
  }
}
