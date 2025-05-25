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
 * CRITICAL FIX: Enhanced reminder processing with proper separation of reminder types
 * FIXED: Only processes check-in reminders normally, creates final delivery dynamically when needed
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
  
  logWithTimestamp(`[REMINDER-PROCESSOR] Starting enhanced reminder processing`, {
    messageId,
    forceSend,
    debug
  });
  
  try {
    // CRITICAL FIX: Process check-in reminders FIRST and separately
    logWithTimestamp(`[REMINDER-PROCESSOR] PHASE 1: Processing check-in reminders only`);
    
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
    
    // CRITICAL FIX: Check for missed deadlines and create final delivery dynamically
    logWithTimestamp(`[REMINDER-PROCESSOR] PHASE 2: Checking for missed deadlines to create final delivery`);
    
    await checkAndCreateFinalDeliveryForMissedDeadlines(supabase, messageId, results);
    
    logWithTimestamp(`[REMINDER-PROCESSOR] Enhanced processing complete`, results);
    return results;
    
  } catch (error: any) {
    logWithTimestamp(`[REMINDER-PROCESSOR] Critical error in enhanced processing:`, error);
    results.errors.push(`Critical processing error: ${error.message}`);
    return results;
  }
}

/**
 * CRITICAL FIX: Check for missed deadlines and create final delivery reminders dynamically
 */
async function checkAndCreateFinalDeliveryForMissedDeadlines(
  supabase: any, 
  messageId?: string, 
  results?: any
): Promise<void> {
  try {
    logWithTimestamp(`[REMINDER-PROCESSOR] Checking for missed check-in deadlines`);
    
    // Find active check-in conditions where deadline has passed
    let conditionsQuery = supabase
      .from('message_conditions')
      .select(`
        id, message_id, condition_type, hours_threshold, minutes_threshold, 
        last_checked, active, recipients
      `)
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date']);
    
    if (messageId) {
      conditionsQuery = conditionsQuery.eq('message_id', messageId);
    }
    
    const { data: conditions, error: conditionsError } = await conditionsQuery;
    
    if (conditionsError) {
      logWithTimestamp(`[REMINDER-PROCESSOR] Error fetching conditions:`, conditionsError);
      return;
    }
    
    if (!conditions || conditions.length === 0) {
      logWithTimestamp(`[REMINDER-PROCESSOR] No active check-in conditions found`);
      return;
    }
    
    const now = new Date();
    
    for (const condition of conditions) {
      try {
        // Calculate deadline
        const lastChecked = new Date(condition.last_checked);
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
        deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
        
        // Check if deadline has passed
        if (deadline <= now) {
          logWithTimestamp(`[REMINDER-PROCESSOR] Deadline missed for condition ${condition.id}, checking for final delivery`);
          
          // Check if final delivery already exists
          const { data: existingFinalDelivery } = await supabase
            .from('reminder_schedule')
            .select('id')
            .eq('message_id', condition.message_id)
            .eq('condition_id', condition.id)
            .eq('reminder_type', 'final_delivery')
            .limit(1);
          
          if (existingFinalDelivery && existingFinalDelivery.length > 0) {
            logWithTimestamp(`[REMINDER-PROCESSOR] Final delivery already exists for condition ${condition.id}`);
            continue;
          }
          
          // Create final delivery reminder dynamically
          logWithTimestamp(`[REMINDER-PROCESSOR] Creating dynamic final delivery for missed deadline`);
          
          const finalDeliveryEntry = {
            message_id: condition.message_id,
            condition_id: condition.id,
            scheduled_at: deadline.toISOString(),
            reminder_type: 'final_delivery',
            status: 'pending',
            delivery_priority: 'critical',
            retry_strategy: 'aggressive'
          };
          
          const { error: insertError } = await supabase
            .from('reminder_schedule')
            .insert([finalDeliveryEntry]);
          
          if (insertError) {
            logWithTimestamp(`[REMINDER-PROCESSOR] Error creating final delivery:`, insertError);
            if (results) {
              results.errors.push(`Failed to create final delivery for condition ${condition.id}: ${insertError.message}`);
            }
          } else {
            logWithTimestamp(`[REMINDER-PROCESSOR] Successfully created final delivery for condition ${condition.id}`);
            
            // Process the final delivery immediately since deadline is already passed
            const finalResult = await processIndividualReminderWithRecovery(finalDeliveryEntry, true);
            
            if (results) {
              results.processedCount++;
              if (finalResult.success) {
                results.successCount++;
                logWithTimestamp(`[REMINDER-PROCESSOR] Final delivery processed successfully`);
              } else {
                results.failedCount++;
                results.errors.push(`Final delivery processing failed: ${finalResult.error}`);
              }
            }
          }
        } else {
          const minutesUntilDeadline = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60));
          logWithTimestamp(`[REMINDER-PROCESSOR] Condition ${condition.id} deadline not yet reached (${minutesUntilDeadline} minutes remaining)`);
        }
      } catch (conditionError: any) {
        logWithTimestamp(`[REMINDER-PROCESSOR] Error processing condition ${condition.id}:`, conditionError);
        if (results) {
          results.errors.push(`Error processing condition ${condition.id}: ${conditionError.message}`);
        }
      }
    }
  } catch (error: any) {
    logWithTimestamp(`[REMINDER-PROCESSOR] Error in checkAndCreateFinalDeliveryForMissedDeadlines:`, error);
  }
}

/**
 * Process a single reminder with proper type handling and recovery
 * ENHANCED: Uses reminder_type field as primary determinant for message routing
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
    
    // CRITICAL FIX: Use reminder_type as the PRIMARY and ONLY determinant
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
