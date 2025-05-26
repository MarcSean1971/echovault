
import { supabaseClient } from "../supabase-client.ts";
import { sendCreatorReminder } from "./reminder-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * Processes individual reminders with recovery logic
 */
export async function processIndividualReminder(
  reminder: any,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    console.log(`[REMINDER-PROCESSOR] Processing reminder ${reminder.id}`, {
      reminderType: reminder.reminder_type,
      messageId: reminder.message_id,
      conditionId: reminder.condition_id,
      scheduledAt: reminder.scheduled_at
    });
    
    // Only process reminder_type = 'reminder' (check-in reminders to creators)
    if (reminder.reminder_type !== 'reminder') {
      throw new Error(`Wrong reminder type: ${reminder.reminder_type}. Only 'reminder' type allowed.`);
    }
    
    // Get message and condition details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, title, user_id, sender_name')
      .eq('id', reminder.message_id)
      .single();
      
    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message || 'Unknown error'}`);
    }
    
    const { data: condition, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('id', reminder.condition_id)
      .single();
      
    if (conditionError || !condition) {
      throw new Error(`Condition not found: ${conditionError?.message || 'Unknown error'}`);
    }
    
    // Calculate time until scheduled time for display purposes
    const scheduledTime = new Date(reminder.scheduled_at);
    const now = new Date();
    const hoursUntilScheduled = Math.max(0, (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    // Send check-in reminder to the message creator
    const creatorResults = await sendCreatorReminder(
      message.id,
      condition.id,
      message.title,
      message.user_id,
      hoursUntilScheduled,
      reminder.scheduled_at,
      debug
    );
    
    // Mark reminder as sent if at least one delivery was successful
    const hasSuccessfulDelivery = creatorResults.some(r => r.success);
    
    if (hasSuccessfulDelivery) {
      const { error: updateError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'sent',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
        
      if (updateError) {
        console.error(`[REMINDER-PROCESSOR] Error updating reminder status:`, updateError);
      }
    } else {
      // All deliveries failed - mark as failed and increment retry count
      const { error: updateError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'failed',
          last_attempt_at: new Date().toISOString(),
          retry_count: (reminder.retry_count || 0) + 1
        })
        .eq('id', reminder.id);
        
      if (updateError) {
        console.error(`[REMINDER-PROCESSOR] Error updating failed reminder:`, updateError);
      }
      
      throw new Error(`All deliveries failed for reminder ${reminder.id}`);
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error(`[REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
    
    // Update reminder status to failed
    try {
      await supabase
        .from('reminder_schedule')
        .update({
          status: 'failed',
          last_attempt_at: new Date().toISOString(),
          retry_count: (reminder.retry_count || 0) + 1
        })
        .eq('id', reminder.id);
    } catch (updateError) {
      console.error(`[REMINDER-PROCESSOR] Error updating failed reminder status:`, updateError);
    }
    
    return { 
      success: false, 
      error: error.message || 'Unknown processing error' 
    };
  }
}

/**
 * Processes multiple due reminders
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<{ processedCount: number; successCount: number; failedCount: number; errors: string[] }> {
  const supabase = supabaseClient();
  const results = {
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    errors: [] as string[]
  };
  
  try {
    console.log(`[REMINDER-PROCESSOR] Processing check-in reminders for creators ONLY`, {
      messageId,
      forceSend,
      debug
    });
    
    // Get due check-in reminders (reminder_type = 'reminder')
    let checkInQuery = supabase
      .from('reminder_schedule')
      .select('*')
      .eq('reminder_type', 'reminder') // ONLY check-in reminders
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());
    
    if (messageId) {
      checkInQuery = checkInQuery.eq('message_id', messageId);
    }
    
    const { data: checkInReminders, error: checkInError } = await checkInQuery.limit(25);
    
    if (checkInError) {
      console.error(`[REMINDER-PROCESSOR] Error fetching check-in reminders:`, checkInError);
      results.errors.push(`Check-in query error: ${checkInError.message}`);
    } else if (checkInReminders && checkInReminders.length > 0) {
      console.log(`[REMINDER-PROCESSOR] Found ${checkInReminders.length} due check-in reminders`);
      
      for (const reminder of checkInReminders) {
        const reminderResult = await processIndividualReminder(reminder, debug);
        results.processedCount++;
        
        if (reminderResult.success) {
          results.successCount++;
        } else {
          results.failedCount++;
          results.errors.push(`Reminder ${reminder.id}: ${reminderResult.error}`);
        }
      }
    } else {
      console.log(`[REMINDER-PROCESSOR] No due check-in reminders found`);
    }
    
    return results;
    
  } catch (error: any) {
    console.error(`[REMINDER-PROCESSOR] Critical error in processing:`, error);
    results.errors.push(`Critical processing error: ${error.message}`);
    return results;
  }
}
