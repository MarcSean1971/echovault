
import { supabaseClient } from "./supabase-client.ts";
import { calculateCheckInDeadline, calculateScheduledDeadline } from "./services/deadline-calculator.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";

/**
 * Simplified reminder service - handles only check-in reminders to creators
 */
export async function processReminder(reminder: any, debug: boolean = false): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    if (debug) {
      console.log(`Processing reminder ${reminder.id} for message ${reminder.message_id}`);
    }
    
    // Get message and condition details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*, message_conditions!inner(*)')
      .eq('id', reminder.message_id)
      .single();
    
    if (messageError || !message) {
      console.error(`Error fetching message ${reminder.message_id}:`, messageError);
      return { success: false, error: 'Message not found' };
    }
    
    const condition = message.message_conditions[0];
    if (!condition) {
      console.error(`No condition found for message ${reminder.message_id}`);
      return { success: false, error: 'Condition not found' };
    }
    
    // Calculate deadline and time until deadline
    let deadlineInfo;
    
    if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
      deadlineInfo = calculateCheckInDeadline(
        condition.last_checked,
        condition.hours_threshold || 0,
        condition.minutes_threshold || 0
      );
    } else if (condition.trigger_date) {
      deadlineInfo = calculateScheduledDeadline(condition.trigger_date);
    } else {
      console.error(`No deadline could be determined for reminder ${reminder.id}`);
      return { success: false, error: 'No deadline available' };
    }
    
    // Only process check-in reminders (sent to creators)
    const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    const isFinalDelivery = reminder.reminder_type === 'final_delivery';
    
    if (isCheckInCondition && !isFinalDelivery) {
      // Send check-in reminder to creator
      console.log(`[REMINDER-SERVICE] Processing check-in reminder for creator ${message.user_id}`);
      
      const reminderResults = await sendCreatorReminder(
        message.id,
        condition.id,
        message.title,
        message.user_id,
        deadlineInfo.hoursUntilDeadline,
        reminder.scheduled_at,
        debug
      );
      
      const successCount = reminderResults.filter(r => r.success).length;
      const errors = reminderResults.filter(r => !r.success).map(r => r.error).filter(Boolean);
      
      if (debug) {
        console.log(`Check-in reminder processed: ${successCount} successful deliveries, ${errors.length} errors`);
      }
      
      return { 
        success: successCount > 0, 
        error: errors.length > 0 ? errors.join('; ') : undefined 
      };
    } else {
      // This service now only handles check-in reminders
      // Final deliveries are handled by a different service
      console.log(`[REMINDER-SERVICE] Skipping non-check-in reminder type: ${reminder.reminder_type}`);
      return { success: false, error: 'This service only handles check-in reminders' };
    }
    
  } catch (error: any) {
    console.error(`Error processing reminder ${reminder.id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
