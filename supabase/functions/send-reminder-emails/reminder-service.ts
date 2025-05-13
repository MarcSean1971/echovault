
import { recordReminderSent } from "./db/reminder-tracking.ts";
import { sendCreatorReminder, sendRecipientReminders } from "./services/reminder-sender.ts";
import { supabaseClient } from "./supabase-client.ts";
import { ReminderData, ReminderResult } from "./types/reminder-types.ts";
import { isCheckInCondition } from "./utils/condition-type.ts";

/**
 * Send reminder for a message
 */
export async function sendReminder(data: ReminderData, debug = false): Promise<{ success: boolean; results: ReminderResult[] }> {
  const { message, condition, hoursUntilDeadline } = data;
  
  try {
    // Remove the blocking check for trigger_date since we now handle null dates elsewhere
    // Instead, log a warning but continue with the reminder
    if (!condition.trigger_date) {
      console.log(`No trigger_date set for condition ${condition.id}, but proceeding with test reminder`);
    }
    
    // Get sender name
    let senderName = "Unknown Sender";
    try {
      const supabase = supabaseClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', message.user_id)
        .single();
      
      if (!error && profile) {
        senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        if (!senderName) senderName = "EchoVault User";
      }
    } catch (error) {
      console.error("Error fetching sender info:", error);
    }
    
    if (debug) {
      console.log(`Sending reminders for message "${message.title}" from ${senderName}`);
      console.log(`Message user_id: ${message.user_id}`);
      console.log(`Deadline in ${condition.trigger_date ? hoursUntilDeadline.toFixed(1) : 'N/A'} hours`);
    }
    
    const reminderResults: ReminderResult[] = [];
    
    // Check if this is a check-in related condition
    // These condition types should only send reminders to the message creator
    const checkInCondition = isCheckInCondition(condition.condition_type);
    
    if (debug) {
      console.log(`Condition type: ${condition.condition_type}`);
      console.log(`Is check-in condition: ${checkInCondition}`);
    }
    
    if (checkInCondition) {
      // For check-in conditions, only send reminder to the message creator
      if (debug) {
        console.log(`This is a check-in condition, only sending reminder to creator`);
      }
      
      const creatorResults = await sendCreatorReminder(
        message.id,
        condition.id,
        message.title,
        message.user_id,
        hoursUntilDeadline,
        condition.trigger_date || new Date().toISOString(),
        debug
      );
      
      reminderResults.push(...creatorResults);
    } else {
      // For non-check-in conditions (e.g., panic_trigger), send reminders to the recipients
      const recipientResults = await sendRecipientReminders(
        message.id,
        message.title,
        senderName,
        condition.recipients,
        hoursUntilDeadline,
        condition.trigger_date || new Date().toISOString(),
        debug
      );
      
      reminderResults.push(...recipientResults);
    }
    
    // Record that reminders were sent
    try {
      // Get user_id from message
      if (!message.user_id) {
        console.warn(`No user_id in message ${message.id}, using string 'unknown'`);
      }
      
      // Pass user_id from message to recordReminderSent
      const recordResult = await recordReminderSent(
        message.id, 
        condition.id, 
        condition.trigger_date || new Date().toISOString(),
        message.user_id || 'unknown'
      );
      
      if (!recordResult) {
        console.warn(`Failed to record reminder for message ${message.id}`);
      }
    } catch (error) {
      console.error(`Error recording reminder for message ${message.id}:`, error);
    }
    
    // Count successes
    const successfulReminders = reminderResults.filter(r => r.success).length;
    
    return {
      success: successfulReminders > 0,
      results: reminderResults
    };
  } catch (error: any) {
    console.error(`Error sending reminders for message ${message.id}:`, error);
    return {
      success: false,
      results: [{
        success: false,
        error: error.message || "Unknown error in sendReminder function"
      }]
    };
  }
}
