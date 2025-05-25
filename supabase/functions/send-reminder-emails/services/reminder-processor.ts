
import { supabaseClient } from "../supabase-client.ts";
import { sendCreatorReminder } from "./reminder-sender.ts";

// Enhanced logging with better formatting
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * SIMPLIFIED: Process only check-in reminders (reminder_type = 'reminder') for creators
 * This function now ONLY handles check-in reminders sent to message creators
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
  
  logWithTimestamp(`[REMINDER-PROCESSOR] Starting SIMPLIFIED processing - check-in reminders ONLY`, {
    messageId,
    forceSend,
    debug
  });
  
  try {
    // SIMPLIFIED: Process ONLY check-in reminders (reminder_type = 'reminder')
    logWithTimestamp(`[REMINDER-PROCESSOR] Processing check-in reminders for creators ONLY`);
    
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
      logWithTimestamp(`[REMINDER-PROCESSOR] Error fetching check-in reminders:`, checkInError);
      results.errors.push(`Check-in query error: ${checkInError.message}`);
    } else if (checkInReminders && checkInReminders.length > 0) {
      logWithTimestamp(`[REMINDER-PROCESSOR] Found ${checkInReminders.length} due check-in reminders`);
      
      for (const reminder of checkInReminders) {
        const checkInResult = await processIndividualReminderWithRecovery(reminder, debug);
        results.processedCount++;
        
        if (checkInResult.success) {
          results.successCount++;
          logWithTimestamp(`[REMINDER-PROCESSOR] Check-in reminder ${reminder.id} processed successfully`);
        } else {
          results.failedCount++;
          results.errors.push(`Check-in reminder ${reminder.id}: ${checkInResult.error}`);
          logWithTimestamp(`[REMINDER-PROCESSOR] Check-in reminder ${reminder.id} failed:`, checkInResult.error);
        }
      }
    } else {
      logWithTimestamp(`[REMINDER-PROCESSOR] No due check-in reminders found`);
    }
    
    logWithTimestamp(`[REMINDER-PROCESSOR] SIMPLIFIED processing complete - check-in reminders only`, results);
    return results;
    
  } catch (error: any) {
    logWithTimestamp(`[REMINDER-PROCESSOR] Critical error in simplified processing:`, error);
    results.errors.push(`Critical processing error: ${error.message}`);
    return results;
  }
}

/**
 * Process a single check-in reminder for the message creator
 * SIMPLIFIED: Only handles reminder_type = 'reminder' sent to creators
 */
export async function processIndividualReminderWithRecovery(
  reminder: any,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    logWithTimestamp(`[REMINDER-PROCESSOR] Processing check-in reminder ${reminder.id}`, {
      reminderType: reminder.reminder_type,
      messageId: reminder.message_id,
      conditionId: reminder.condition_id,
      scheduledAt: reminder.scheduled_at
    });
    
    // SIMPLIFIED: Only process reminder_type = 'reminder'
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
    
    logWithTimestamp(`[REMINDER-PROCESSOR] Check-in reminder details`, {
      reminderType: reminder.reminder_type,
      hoursUntilScheduled,
      messageTitle: message.title,
      creatorUserId: message.user_id
    });
    
    // SIMPLIFIED: Send check-in reminder ONLY to the message creator
    logWithTimestamp(`[REMINDER-PROCESSOR] Sending check-in reminder to creator ${message.user_id}`);
    
    const creatorResults = await sendCreatorReminder(
      message.id,
      condition.id,
      message.title,
      message.user_id,
      hoursUntilScheduled,
      reminder.scheduled_at,
      debug
    );
    
    logWithTimestamp(`[REMINDER-PROCESSOR] Check-in reminder sent to creator`, {
      results: creatorResults.map(r => ({ success: r.success, recipient: r.recipient, channel: r.channel }))
    });
    
    // Log delivery results to the database for tracking
    for (const result of creatorResults) {
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: result.recipient,
          delivery_channel: result.channel,
          channel_order: 1,
          delivery_status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
          response_data: {
            reminder_type: reminder.reminder_type,
            scheduled_at: reminder.scheduled_at,
            processed_at: new Date().toISOString(),
            message_id: result.messageId
          }
        });
      } catch (logError) {
        console.error(`[REMINDER-PROCESSOR] Error logging delivery result:`, logError);
        // Don't fail the entire process for logging errors
      }
    }
    
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
      } else {
        logWithTimestamp(`[REMINDER-PROCESSOR] Check-in reminder ${reminder.id} marked as sent`);
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
      
      throw new Error(`All deliveries failed for check-in reminder ${reminder.id}`);
    }
    
    return { success: true };
    
  } catch (error: any) {
    logWithTimestamp(`[REMINDER-PROCESSOR] Error processing check-in reminder ${reminder.id}:`, {
      error: error.message,
      stack: error.stack
    });
    
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
