
import { supabaseClient } from "../supabase-client.ts";
import { sendCreatorReminder, sendRecipientReminders } from "./reminder-sender.ts";

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
 * Process a single reminder with proper type handling and recovery
 * FIXED: Uses reminder_type field as primary determinant for message routing
 */
export async function processIndividualReminderWithRecovery(
  reminder: any,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    logWithTimestamp(`[REMINDER-PROCESSOR] Processing reminder ${reminder.id}`, {
      reminderType: reminder.reminder_type,
      messageId: reminder.message_id,
      conditionId: reminder.condition_id,
      scheduledAt: reminder.scheduled_at
    });
    
    // CRITICAL FIX: Use reminder_type as the PRIMARY determinant
    const isCheckInReminder = reminder.reminder_type === 'reminder';
    const isFinalDelivery = reminder.reminder_type === 'final_delivery';
    
    if (!isCheckInReminder && !isFinalDelivery) {
      throw new Error(`Unknown reminder type: ${reminder.reminder_type}`);
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
    
    logWithTimestamp(`[REMINDER-PROCESSOR] Reminder details`, {
      reminderType: reminder.reminder_type,
      isCheckInReminder,
      isFinalDelivery,
      hoursUntilScheduled,
      messageTitle: message.title,
      creatorUserId: message.user_id
    });
    
    let results = [];
    
    if (isCheckInReminder) {
      // CHECK-IN REMINDER: Send ONLY to the message creator
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
      
      results = creatorResults;
      logWithTimestamp(`[REMINDER-PROCESSOR] Check-in reminder sent to creator`, {
        results: creatorResults.map(r => ({ success: r.success, recipient: r.recipient, channel: r.channel }))
      });
      
    } else if (isFinalDelivery) {
      // FINAL DELIVERY: Send ONLY to the configured recipients
      logWithTimestamp(`[REMINDER-PROCESSOR] Sending final delivery to recipients`);
      
      // Get recipients from condition
      const recipients = condition.recipients || [];
      if (recipients.length === 0) {
        throw new Error('No recipients configured for final delivery');
      }
      
      logWithTimestamp(`[REMINDER-PROCESSOR] Recipients for final delivery`, {
        recipientCount: recipients.length,
        recipients: recipients.map(r => ({ name: r.name, email: r.email }))
      });
      
      const recipientResults = await sendRecipientReminders(
        message.id,
        message.title,
        message.sender_name || 'EchoVault User',
        recipients,
        hoursUntilScheduled,
        reminder.scheduled_at,
        debug,
        true // isFinalDelivery = true
      );
      
      results = recipientResults;
      logWithTimestamp(`[REMINDER-PROCESSOR] Final delivery sent to recipients`, {
        results: recipientResults.map(r => ({ success: r.success, recipient: r.recipient, channel: r.channel }))
      });
    }
    
    // Log delivery results to the database for tracking
    for (const result of results) {
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
    const hasSuccessfulDelivery = results.some(r => r.success);
    
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
        logWithTimestamp(`[REMINDER-PROCESSOR] Reminder ${reminder.id} marked as sent`);
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
    logWithTimestamp(`[REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, {
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

/**
 * Process multiple reminders with proper batching and error handling
 */
export async function processDueReminders(
  reminders: any[],
  debug: boolean = false
): Promise<{ processed: number; successful: number; failed: number; errors: string[] }> {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  logWithTimestamp(`[REMINDER-PROCESSOR] Processing ${reminders.length} due reminders`);
  
  for (const reminder of reminders) {
    try {
      const result = await processIndividualReminderWithRecovery(reminder, debug);
      results.processed++;
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`Reminder ${reminder.id}: ${result.error}`);
        }
      }
    } catch (error: any) {
      results.processed++;
      results.failed++;
      results.errors.push(`Reminder ${reminder.id}: ${error.message}`);
      logWithTimestamp(`[REMINDER-PROCESSOR] Unexpected error processing reminder ${reminder.id}:`, error);
    }
  }
  
  logWithTimestamp(`[REMINDER-PROCESSOR] Batch processing complete`, results);
  return results;
}
