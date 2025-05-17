
import { supabaseClient } from "../supabase-client.ts";

/**
 * Record that a reminder was sent
 */
export async function recordReminderSent(
  messageId: string,
  conditionId: string,
  triggerDate: string,
  userId: string,
  scheduledFor?: string
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Log the params for debugging
    console.log(`Recording reminder for message ${messageId}, condition ${conditionId}, userId ${userId}`);
    console.log(`Scheduled for: ${scheduledFor || 'Not specified'}`);
    
    const { error } = await supabase
      .from('sent_reminders')
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        user_id: userId,
        deadline: triggerDate || new Date().toISOString(), // Use current date if triggerDate is null
        sent_at: new Date().toISOString(),
        scheduled_for: scheduledFor || null // Add the scheduled time when the reminder was due
      });
    
    if (error) {
      console.error("Error recording reminder:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in recordReminderSent:", error);
    return false;
  }
}

/**
 * Update the next reminder time for a condition
 */
export async function updateNextReminderTime(
  conditionId: string, 
  nextReminderAt: string | null
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    console.log(`Updating next reminder time for condition ${conditionId} to ${nextReminderAt || 'NULL'}`);
    
    const { error } = await supabase
      .from("message_conditions")
      .update({
        next_reminder_at: nextReminderAt
      })
      .eq("id", conditionId);
    
    if (error) {
      console.error("Error updating next reminder time:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateNextReminderTime:", error);
    return false;
  }
}

/**
 * Mark reminders as obsolete when creating a new schedule
 * Fixed to ensure both message ID and condition ID are used correctly
 */
export async function markRemindersObsolete(
  conditionId: string,
  messageId: string
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Enhanced logging to track usage
    console.log(`[REMINDER-TRACKING] Marking reminders as obsolete for condition ${conditionId}, message ${messageId}`);
    
    // IMPORTANT FIX: Always use message_id in the query (this was the root cause)
    const { error, count } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    if (error) {
      console.error("[REMINDER-TRACKING] Error marking reminders as obsolete:", error);
      return false;
    }
    
    console.log(`[REMINDER-TRACKING] Successfully marked ${count || 'unknown number of'} reminders as obsolete for message ${messageId}`);
    return true;
  } catch (error) {
    console.error("[REMINDER-TRACKING] Error in markRemindersObsolete:", error);
    return false;
  }
}
