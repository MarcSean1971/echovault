
import { supabaseClient } from "../supabase-client.ts";

/**
 * Record that a reminder was sent
 * Using service role client to bypass RLS
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
 * Using service role client to bypass RLS
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
 * Using service role client to bypass RLS
 * FIXED: Added isEditOperation parameter to control notification behavior
 */
export async function markRemindersObsolete(
  conditionId: string,
  messageId: string,
  isEditOperation: boolean = false
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Enhanced logging to track usage
    console.log(`[REMINDER-TRACKING] Marking reminders as obsolete for condition ${conditionId}, message ${messageId}, isEdit: ${isEditOperation}`);
    
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
    
    // CRITICAL FIX: Add deduplication by checking if notification was already sent recently
    try {
      // Check if a notification was sent in the last 5 minutes to avoid duplicates
      const recentCheck = new Date();
      recentCheck.setMinutes(recentCheck.getMinutes() - 5);
      
      const { data: recentNotifications } = await supabase
        .from('reminder_delivery_log')
        .select('id')
        .eq('message_id', messageId)
        .eq('delivery_channel', 'immediate-check')
        .gt('created_at', recentCheck.toISOString())
        .limit(1);
      
      if (recentNotifications && recentNotifications.length > 0) {
        console.log("[REMINDER-TRACKING] Skipping immediate check as one was done recently");
        return true; // Skip sending another notification
      }
      
      // Create a tracking log for this check to prevent duplicates
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `obsolete-check-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: 'system',
        delivery_channel: 'immediate-check',
        delivery_status: 'processing',
        response_data: { source: "markRemindersObsolete", time: new Date().toISOString(), isEdit: isEditOperation }
      });
      
      // CRITICAL FIX: Skip immediate check if this is an edit operation
      if (isEditOperation) {
        console.log("[REMINDER-TRACKING] Skipping immediate reminder check because this is an edit operation");
        return true; // Skip the immediate check
      }
      
      // REMOVED: The direct function call that was causing duplicate notifications
    } catch (checkError) {
      console.error("[REMINDER-TRACKING] Error running immediate reminder check:", checkError);
      // Non-fatal error, continue execution
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-TRACKING] Error in markRemindersObsolete:", error);
    return false;
  }
}
