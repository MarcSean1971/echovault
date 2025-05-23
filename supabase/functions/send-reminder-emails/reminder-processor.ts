
import { supabaseClient } from "./supabase-client.ts";
import { processReminder } from "./reminder-service.ts";

// Result interface for processed reminders
interface ReminderProcessingResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  conditionType?: string;
  results: any[];
}

/**
 * Process all due reminders with atomic operations
 * Optimized to use batching and more efficient DB operations
 * 
 * @param messageIds - Array of message IDs to process reminders for
 * @param options - Options for processing
 * @returns Processing results
 */
export async function processReminders(
  messageIds: string[],
  options: { debug?: boolean, forceSend?: boolean } = {}
): Promise<any[]> {
  const { debug = false, forceSend = false } = options;
  const results: any[] = [];
  
  try {
    if (debug) {
      console.log(`[PROCESSOR] Processing reminders for ${messageIds.length} messages, forceSend: ${forceSend}`);
    }
    
    // Process each message ID in the array
    for (const messageId of messageIds) {
      // Get due reminders for this message
      const processingResult = await processDueReminders(messageId, forceSend, debug);
      
      if (debug) {
        console.log(`[PROCESSOR] Results for message ${messageId}:`);
        console.log(`  - Processed: ${processingResult.processedCount}`);
        console.log(`  - Success: ${processingResult.successCount}`);
        console.log(`  - Failed: ${processingResult.failedCount}`);
        console.log(`  - Skipped: ${processingResult.skippedCount}`);
      }
      
      results.push({
        message_id: messageId,
        processed: processingResult.processedCount,
        success: processingResult.successCount,
        failed: processingResult.failedCount,
        skipped: processingResult.skippedCount,
        results: processingResult.results
      });
    }
    
    return results;
  } catch (error) {
    console.error("[PROCESSOR] Error in processReminders:", error);
    throw error;
  }
}

/**
 * Process all due reminders with atomic operations
 * Optimized to use batching and more efficient DB operations
 * 
 * @param messageId - Optional message ID to filter reminders
 * @param forceSend - Whether to force send reminders even if not due
 * @param debug - Enable debug logging
 * @param batchSize - Number of reminders to process in a batch
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false,
  batchSize: number = 50
): Promise<ReminderProcessingResult> {
  const supabase = supabaseClient();
  const results: ReminderProcessingResult = {
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    results: []
  };
  
  try {
    // Performance improvement: Increased batch size for more efficient processing
    // but only if not targeting a specific message
    if (messageId) {
      batchSize = 10;
    }
    
    if (debug) {
      console.log(`[OPTIMIZED] Processing reminders with batch size ${batchSize}`);
      console.log(`[OPTIMIZED] Target message ID: ${messageId || 'None (processing all due reminders)'}`);
    }
    
    // First, select due reminders using FOR UPDATE SKIP LOCKED to prevent concurrent processing
    let query = supabase.rpc('acquire_due_reminders', {
      max_reminders: batchSize, // Process multiple reminders at a time for better efficiency
      message_filter: messageId || null
    });
    
    if (forceSend && messageId) {
      // If forcing send for a specific message, select even if not due
      query = supabase.rpc('acquire_message_reminders', {
        target_message_id: messageId,
        max_reminders: batchSize
      });
    }
    
    const { data: dueReminders, error: selectError } = await query;
    
    if (selectError) {
      console.error("Error selecting due reminders:", selectError);
      throw selectError;
    }
    
    if (!dueReminders || dueReminders.length === 0) {
      console.log("No due reminders found");
      return results;
    }
    
    console.log(`Found ${dueReminders.length} reminders to process`);
    
    // OPTIMIZATION: Group reminders by message ID for more efficient processing
    // This allows us to fetch message data once per message rather than once per reminder
    const remindersByMessage: Record<string, any[]> = {};
    dueReminders.forEach(reminder => {
      if (!remindersByMessage[reminder.message_id]) {
        remindersByMessage[reminder.message_id] = [];
      }
      remindersByMessage[reminder.message_id].push(reminder);
    });
    
    // Process reminders by message group for better efficiency
    for (const [msgId, messageReminders] of Object.entries(remindersByMessage)) {
      if (debug) {
        console.log(`Processing batch of ${messageReminders.length} reminders for message ${msgId}`);
      }
      
      // Get condition type to include in the result
      const { data: conditionData } = await supabase
        .from('message_conditions')
        .select('condition_type')
        .eq('message_id', msgId)
        .single();
        
      if (conditionData) {
        results.conditionType = conditionData.condition_type;
      }
      
      // Process each reminder for this message
      for (const reminder of messageReminders) {
        try {
          results.processedCount++;
          
          if (debug) {
            console.log(`-----------------------------------`);
            console.log(`Processing reminder ${reminder.id}`);
            console.log(`Message ID: ${reminder.message_id}`);
            console.log(`Scheduled for: ${reminder.scheduled_at}`);
            console.log(`Reminder type: ${reminder.reminder_type}`);
            console.log(`-----------------------------------`);
          }
          
          // Process the reminder
          const processingResult = await processReminder(reminder, debug);
          
          // Update reminder status based on result
          if (processingResult.success) {
            await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'sent', 
                last_attempt_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
              
            results.successCount++;
          } else {
            // Increment retry count and mark as failed if max retries reached
            const retryCount = (reminder.retry_count || 0) + 1;
            const maxRetries = reminder.reminder_type === 'final_delivery' ? 5 : 3;
            const status = retryCount >= maxRetries ? 'failed' : 'pending';
            
            await supabase
              .from('reminder_schedule')
              .update({ 
                status, 
                retry_count: retryCount,
                last_attempt_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
              
            if (status === 'failed') {
              results.failedCount++;
            } else {
              results.skippedCount++;
            }
          }
          
          results.results.push({
            id: reminder.id,
            message_id: reminder.message_id,
            scheduled_at: reminder.scheduled_at,
            reminder_type: reminder.reminder_type,
            success: processingResult.success,
            error: processingResult.error
          });
        } catch (reminderError: any) {
          console.error(`Error processing reminder ${reminder.id}:`, reminderError);
          
          // Mark as failed in case of exception
          await supabase
            .from('reminder_schedule')
            .update({ 
              status: 'failed',
              retry_count: (reminder.retry_count || 0) + 1,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', reminder.id);
            
          results.failedCount++;
          results.results.push({
            id: reminder.id,
            message_id: reminder.message_id,
            success: false,
            error: reminderError.message || "Unknown error"
          });
        }
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("Error in processDueReminders:", error);
    throw error;
  }
}
