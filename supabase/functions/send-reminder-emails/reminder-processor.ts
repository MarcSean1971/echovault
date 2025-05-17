
import { supabaseClient } from "./supabase-client.ts";
import { processReminder } from "./reminder-service.ts";

// Result interface for processed reminders
interface ReminderProcessingResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  details: any[];
}

/**
 * Process all due reminders with atomic operations
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<ReminderProcessingResult> {
  const supabase = supabaseClient();
  const results: ReminderProcessingResult = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  try {
    // First, select due reminders using FOR UPDATE SKIP LOCKED to prevent concurrent processing
    let query = supabase.rpc('acquire_due_reminders', {
      max_reminders: 50, // Process up to 50 reminders at a time
      message_filter: messageId || null
    });
    
    if (forceSend && messageId) {
      // If forcing send for a specific message, select even if not due
      query = supabase.rpc('acquire_message_reminders', {
        target_message_id: messageId,
        max_reminders: 10
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
    
    // Process each reminder and collect results
    for (const reminder of dueReminders) {
      try {
        results.totalProcessed++;
        
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
            
          results.successful++;
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
            results.failed++;
          } else {
            results.skipped++;
          }
        }
        
        results.details.push({
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
          
        results.failed++;
        results.details.push({
          id: reminder.id,
          message_id: reminder.message_id,
          success: false,
          error: reminderError.message || "Unknown error"
        });
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("Error in processDueReminders:", error);
    throw error;
  }
}
