/**
 * Utility functions for the reminder service
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Mark reminders as obsolete - forwards to server function
 * FIXED: Added isEdit parameter to control notification behavior during edits
 */
export async function markRemindersAsObsolete(
  messageId: string, 
  conditionId: string,
  isEdit: boolean = false
): Promise<boolean> {
  try {
    console.log(`[REMINDER-UTILS] Marking reminders as obsolete for message ${messageId}, condition ${conditionId}, isEdit: ${isEdit}`);
    
    // Use the edge function for reliable reminder updates
    const { error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId,
        conditionId,
        action: "mark-obsolete",
        debug: true,
        isEdit // CRITICAL FIX: Pass the isEdit flag to prevent unwanted notifications
      }
    });
    
    if (error) {
      console.error("[REMINDER-UTILS] Error marking reminders as obsolete:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-UTILS] Error in markRemindersAsObsolete:", error);
    return false;
  }
}

/**
 * Mark existing reminders as obsolete
 * Updated to handle RLS permissions
 */
export async function markExistingRemindersObsolete(messageId: string, conditionId: string): Promise<boolean> {
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
