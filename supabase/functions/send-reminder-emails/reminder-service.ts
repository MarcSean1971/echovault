import { recordReminderSent, updateNextReminderTime } from "./db/reminder-tracking.ts";
import { sendCreatorReminder, sendRecipientReminders } from "./services/reminder-sender.ts";
import { supabaseClient } from "./supabase-client.ts";
import { ReminderData, ReminderResult } from "./types/reminder-types.ts";
import { isCheckInCondition } from "./utils/condition-type.ts";
import { calculateNextReminderTime } from "./utils/reminder-calculator.ts";

/**
 * Send reminder for a message
 */
export async function sendReminder(data: ReminderData, debug = false): Promise<{ success: boolean; results: ReminderResult[] }> {
  const { message, condition, hoursUntilDeadline, matchedReminderMinute } = data;
  
  try {
    console.log(`\n====== SENDING REMINDERS FOR MESSAGE ${message.id} ======`);
    console.log(`Message title: "${message.title}"`);
    console.log(`Condition type: ${condition.condition_type}`);
    console.log(`Debug mode: ${debug ? 'Enabled' : 'Disabled'}`);
    
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
      console.log(`Sender resolved as: ${senderName} (user_id: ${message.user_id})`);
    } catch (error) {
      console.error("Error fetching sender info:", error);
    }
    
    // Log details about the deadline and reminder time
    if (debug) {
      console.log(`Sending reminders for message "${message.title}" from ${senderName}`);
      console.log(`Message user_id: ${message.user_id}`);
      console.log(`Deadline in ${condition.trigger_date ? hoursUntilDeadline.toFixed(1) : 'N/A'} hours`);
      
      if (data.matchedReminderMinute !== null) {
        console.log(`Matched reminder time: ${data.matchedReminderMinute} minutes (${(data.matchedReminderMinute / 60).toFixed(2)} hours) before deadline`);
      }
    }
    
    const reminderResults: ReminderResult[] = [];
    
    // Check if this is a check-in related condition
    const checkInCondition = isCheckInCondition(condition.condition_type);
    
    console.log(`Condition type: ${condition.condition_type}`);
    console.log(`Is check-in condition: ${checkInCondition}`);
    
    // Calculate the scheduled time for this reminder (when it was due)
    const now = new Date();
    let scheduledForTime: Date | null = null;
    
    if (matchedReminderMinute !== null && condition.trigger_date) {
      // This is a scheduled reminder that matched a specific time window
      const deadline = new Date(condition.trigger_date);
      scheduledForTime = new Date(deadline.getTime() - (matchedReminderMinute * 60 * 1000));
      console.log(`Calculated scheduled time: ${scheduledForTime.toISOString()}`);
    } else {
      // Force-sent reminder without a specific schedule
      console.log("No specific scheduled time for this reminder (force sent or manual trigger)");
    }
    
    // CRITICAL FIX: ALWAYS send reminder to creator regardless of condition type
    console.log(`Sending reminder to creator (user_id: ${message.user_id})`);
    
    const creatorResults = await sendCreatorReminder(
      message.id,
      condition.id,
      message.title,
      message.user_id,
      hoursUntilDeadline,
      condition.trigger_date || new Date().toISOString(),
      true // Always enable debug to get more info
    );
    
    reminderResults.push(...creatorResults);
    
    if (creatorResults.some(r => r.success)) {
      console.log(`Successfully sent reminder to creator for message ${message.id}`);
      
      // Log details of successful reminders
      creatorResults.filter(r => r.success).forEach(r => {
        console.log(`✅ Creator reminder sent via ${r.method} to ${r.recipient}`);
      });
    } else {
      console.log(`Failed to send reminder to creator for message ${message.id}`);
      
      // Log details of failed reminders
      creatorResults.filter(r => !r.success).forEach(r => {
        console.log(`❌ Creator reminder failed via ${r.method} to ${r.recipient}: ${r.error}`);
      });
    }
    
    // For non-check-in conditions, also send reminders to the recipients
    if (!checkInCondition) {
      if (condition.recipients && condition.recipients.length > 0) {
        console.log(`Sending reminders to ${condition.recipients.length} recipients for message ${message.id}`);
        
        const recipientResults = await sendRecipientReminders(
          message.id,
          message.title,
          senderName,
          condition.recipients,
          hoursUntilDeadline,
          condition.trigger_date || new Date().toISOString(),
          true // Always enable debug to get more info
        );
        
        reminderResults.push(...recipientResults);
        
        const successCount = recipientResults.filter(r => r.success).length;
        console.log(`Successfully sent ${successCount} out of ${recipientResults.length} recipient reminders for message ${message.id}`);
      } else {
        console.log(`No recipients found for message ${message.id}, skipping reminder to recipients`);
      }
    }
    
    // Calculate the next reminder time
    let nextReminderTime: Date | null = null;
    if (condition.trigger_date && condition.reminder_hours && condition.reminder_hours.length > 0) {
      const deadlineDate = new Date(condition.trigger_date);
      const reminderMinutes = condition.reminder_hours;
      
      // Find the next upcoming reminder time
      nextReminderTime = calculateNextReminderTime(deadlineDate, reminderMinutes, matchedReminderMinute);
      
      if (nextReminderTime) {
        console.log(`Next reminder time calculated: ${nextReminderTime.toISOString()}`);
        
        // Update the next reminder time in the database
        const updateResult = await updateNextReminderTime(condition.id, nextReminderTime.toISOString());
        if (updateResult) {
          console.log(`Successfully updated next reminder time for condition ${condition.id}`);
        } else {
          console.warn(`Failed to update next reminder time for condition ${condition.id}`);
        }
      } else {
        console.log(`No more reminders scheduled for message ${message.id}`);
        await updateNextReminderTime(condition.id, null);
      }
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
        message.user_id || 'unknown',
        scheduledForTime ? scheduledForTime.toISOString() : null
      );
      
      if (recordResult) {
        console.log(`Successfully recorded reminder for message ${message.id} in database`);
      } else {
        console.warn(`Failed to record reminder for message ${message.id}`);
      }
    } catch (error) {
      console.error(`Error recording reminder for message ${message.id}:`, error);
    }
    
    // Count successes
    const successfulReminders = reminderResults.filter(r => r.success).length;
    
    console.log(`====== REMINDER SENDING COMPLETE ======`);
    console.log(`Total reminders attempted: ${reminderResults.length}`);
    console.log(`Successful reminders: ${successfulReminders}`);
    console.log(`Failed reminders: ${reminderResults.length - successfulReminders}`);
    
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
