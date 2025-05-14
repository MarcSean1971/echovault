
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
 * Check if a reminder for this message/condition has been sent recently
 * This helps prevent duplicate reminders within a short time window
 */
export async function hasSentReminderRecently(
  messageId: string,
  conditionId: string,
  reminderMinute: number | null,
  windowMinutes: number = 30 // Default to checking for reminders within the last 30 minutes
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Calculate the cutoff time (default 30 minutes ago)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - windowMinutes);
    
    // Query for any reminders sent for this message/condition within the window
    const query = supabase
      .from('sent_reminders')
      .select('id, sent_at')
      .eq('message_id', messageId)
      .eq('condition_id', conditionId)
      .gte('sent_at', cutoffTime.toISOString());
      
    const { data, error } = await query;
    
    if (error) {
      console.error("Error checking for recent reminders:", error);
      return false; // Assume no recent reminders on error (safer to send)
    }
    
    // If we found any recent reminders, they exist
    const hasRecent = data && data.length > 0;
    
    if (hasRecent) {
      console.log(`Found ${data?.length} recent reminders sent within the last ${windowMinutes} minutes`);
      console.log(`Most recent sent at: ${data?.[0].sent_at}`);
    } else {
      console.log(`No recent reminders found for message ${messageId} within the last ${windowMinutes} minutes`);
    }
    
    return hasRecent;
  } catch (error) {
    console.error("Error in hasSentReminderRecently:", error);
    return false; // Assume no recent reminders on error (safer to send)
  }
}
