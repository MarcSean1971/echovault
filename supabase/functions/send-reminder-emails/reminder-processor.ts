
import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";

/**
 * FIXED: Enhanced reminder processor with comprehensive error handling and cleanup
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<any> {
  try {
    console.log(`[REMINDER-PROCESSOR] Starting enhanced reminder processing for message: ${messageId || 'all'}`);
    
    const supabase = supabaseClient();
    
    // Step 1: Clean up any genuinely stuck reminders first
    console.log("[REMINDER-PROCESSOR] Cleaning up stuck reminders...");
    await cleanupStuckReminders(supabase, debug);
    
    // Step 2: Acquire due reminders with proper locking
    let dueReminders;
    if (messageId) {
      const { data, error } = await supabase.rpc('acquire_message_reminders', {
        target_message_id: messageId,
        max_reminders: 10
      });
      
      if (error) {
        console.error("[REMINDER-PROCESSOR] Error acquiring message reminders:", error);
        throw error;
      }
      dueReminders = data || [];
    } else {
      const { data, error } = await supabase.rpc('acquire_due_reminders', {
        max_reminders: forceSend ? 100 : 20,
        message_filter: null
      });
      
      if (error) {
        console.error("[REMINDER-PROCESSOR] Error acquiring due reminders:", error);
        throw error;
      }
      dueReminders = data || [];
    }
    
    console.log(`[REMINDER-PROCESSOR] Found ${dueReminders.length} reminders to process`);
    
    if (dueReminders.length === 0) {
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        results: []
      };
    }
    
    // Step 3: Process each reminder with enhanced error handling
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const reminder of dueReminders) {
      try {
        console.log(`[REMINDER-PROCESSOR] Processing reminder ${reminder.id} for message ${reminder.message_id}`);
        
        const result = await processIndividualReminderWithRecovery(reminder, debug, supabase);
        
        if (result.success) {
          successCount++;
          console.log(`[REMINDER-PROCESSOR] Successfully processed reminder ${reminder.id}`);
        } else {
          failedCount++;
          console.error(`[REMINDER-PROCESSOR] Failed to process reminder ${reminder.id}:`, result.error);
        }
        
        results.push(result);
        
      } catch (error: any) {
        console.error(`[REMINDER-PROCESSOR] Exception processing reminder ${reminder.id}:`, error);
        failedCount++;
        
        // Mark reminder as failed with proper error logging
        await markReminderAsFailed(supabase, reminder.id, error.message || 'Processing exception', debug);
        
        results.push({
          reminderId: reminder.id,
          success: false,
          error: error.message || 'Processing exception'
        });
      }
    }
    
    console.log(`[REMINDER-PROCESSOR] Processing complete. Processed: ${dueReminders.length}, Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
      processedCount: dueReminders.length,
      successCount,
      failedCount,
      results
    };
    
  } catch (error: any) {
    console.error("[REMINDER-PROCESSOR] Error in processDueReminders:", error);
    throw error;
  }
}

/**
 * Clean up reminders that are genuinely stuck in processing for too long
 */
async function cleanupStuckReminders(supabase: any, debug: boolean): Promise<void> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Find reminders stuck in processing for more than 5 minutes
    const { data: stuckReminders, error: findError } = await supabase
      .from('reminder_schedule')
      .select('id, message_id, last_attempt_at')
      .eq('status', 'processing')
      .lt('last_attempt_at', fiveMinutesAgo);
    
    if (findError) {
      console.warn("[REMINDER-PROCESSOR] Error finding stuck reminders:", findError);
      return;
    }
    
    if (stuckReminders && stuckReminders.length > 0) {
      console.log(`[REMINDER-PROCESSOR] Found ${stuckReminders.length} stuck reminders, resetting...`);
      
      // Reset stuck reminders to pending
      const { error: resetError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'pending',
          last_attempt_at: null,
          updated_at: new Date().toISOString()
        })
        .in('id', stuckReminders.map(r => r.id));
      
      if (resetError) {
        console.error("[REMINDER-PROCESSOR] Error resetting stuck reminders:", resetError);
      } else if (debug) {
        console.log(`[REMINDER-PROCESSOR] Successfully reset ${stuckReminders.length} stuck reminders`);
      }
    }
  } catch (error: any) {
    console.warn("[REMINDER-PROCESSOR] Error in cleanupStuckReminders:", error);
  }
}

/**
 * Process an individual reminder with comprehensive recovery logic
 */
async function processIndividualReminderWithRecovery(reminder: any, debug: boolean, supabase: any): Promise<any> {
  try {
    // Get message and condition details with validation
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        message_conditions!inner(
          *,
          recipients
        )
      `)
      .eq('id', reminder.message_id)
      .single();
    
    if (messageError) {
      console.error(`[REMINDER-PROCESSOR] Error fetching message ${reminder.message_id}:`, messageError);
      throw new Error(`Failed to fetch message data: ${messageError.message}`);
    }
    
    if (!messageData) {
      throw new Error('Message not found');
    }
    
    const condition = messageData.message_conditions?.[0];
    if (!condition) {
      throw new Error('No condition found for message');
    }
    
    if (!condition.recipients) {
      throw new Error('No recipients found in condition');
    }
    
    // Process recipients with enhanced validation
    const recipients = Array.isArray(condition.recipients) ? condition.recipients : [condition.recipients];
    
    if (recipients.length === 0) {
      throw new Error('Recipients array is empty');
    }
    
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailResults = [];
    
    for (const recipient of recipients) {
      if (!recipient.email) {
        console.warn(`[REMINDER-PROCESSOR] Skipping recipient with no email:`, recipient);
        emailsFailed++;
        continue;
      }
      
      try {
        console.log(`[REMINDER-PROCESSOR] Sending email to ${recipient.email}`);
        
        const emailResult = await sendEmail({
          to: recipient.email,
          subject: `Reminder: ${messageData.title}`,
          html: generateReminderEmailHtml(messageData, condition, reminder),
          from: "DeadManSwitch <noreply@deadmanswitch.app>"
        });
        
        if (emailResult.success) {
          emailsSent++;
          console.log(`[REMINDER-PROCESSOR] Email sent successfully to ${recipient.email}, messageId: ${emailResult.messageId}`);
        } else {
          emailsFailed++;
          console.error(`[REMINDER-PROCESSOR] Email failed for ${recipient.email}:`, emailResult.error);
        }
        
        emailResults.push({
          recipient: recipient.email,
          success: emailResult.success,
          error: emailResult.error,
          messageId: emailResult.messageId
        });
        
        // Log delivery attempt with enhanced data
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: recipient.email,
          delivery_channel: 'email',
          delivery_status: emailResult.success ? 'delivered' : 'failed',
          error_message: emailResult.error || null,
          response_data: {
            messageId: emailResult.messageId,
            timestamp: new Date().toISOString(),
            emailLength: generateReminderEmailHtml(messageData, condition, reminder).length
          }
        });
        
      } catch (recipientError: any) {
        console.error(`[REMINDER-PROCESSOR] Error sending to ${recipient.email}:`, recipientError);
        emailsFailed++;
        emailResults.push({
          recipient: recipient.email,
          success: false,
          error: recipientError.message || 'Unknown error'
        });
      }
    }
    
    // Determine final status based on results
    const finalStatus = emailsSent > 0 ? 'sent' : 'failed';
    const finalError = emailsSent === 0 ? 'All email deliveries failed' : null;
    
    // Update reminder status
    const { error: updateError } = await supabase
      .from('reminder_schedule')
      .update({
        status: finalStatus,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reminder.id);
    
    if (updateError) {
      console.error(`[REMINDER-PROCESSOR] Error updating reminder status:`, updateError);
    }
    
    // Add to sent_reminders table if successful
    if (finalStatus === 'sent') {
      try {
        await supabase.from('sent_reminders').insert({
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          user_id: messageData.user_id,
          deadline: condition.trigger_date || new Date().toISOString(),
          scheduled_for: reminder.scheduled_at,
          sent_at: new Date().toISOString()
        });
      } catch (sentReminderError: any) {
        console.warn(`[REMINDER-PROCESSOR] Error inserting sent_reminder record:`, sentReminderError);
      }
    }
    
    return {
      reminderId: reminder.id,
      success: finalStatus === 'sent',
      emailsSent,
      emailsFailed,
      emailResults,
      error: finalError
    };
    
  } catch (error: any) {
    console.error(`[REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
    
    // Mark as failed in database
    await markReminderAsFailed(supabase, reminder.id, error.message || 'Unknown error', false);
    
    return {
      reminderId: reminder.id,
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Mark a reminder as failed with proper error tracking
 */
async function markReminderAsFailed(supabase: any, reminderId: string, errorMessage: string, debug: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('reminder_schedule')
      .update({
        status: 'failed',
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reminderId);
    
    if (error) {
      console.error(`[REMINDER-PROCESSOR] Failed to mark reminder ${reminderId} as failed:`, error);
    } else if (debug) {
      console.log(`[REMINDER-PROCESSOR] Marked reminder ${reminderId} as failed: ${errorMessage}`);
    }
  } catch (updateError: any) {
    console.error(`[REMINDER-PROCESSOR] Exception marking reminder as failed:`, updateError);
  }
}

/**
 * Generate HTML content for reminder emails
 */
function generateReminderEmailHtml(message: any, condition: any, reminder: any): string {
  const reminderType = reminder.reminder_type === 'final_delivery' ? 'FINAL DELIVERY' : 'REMINDER';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">${reminderType}: ${message.title}</h2>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>This is an automated ${reminderType.toLowerCase()} from your DeadManSwitch message.</strong></p>
        
        ${reminder.reminder_type === 'final_delivery' ? 
          '<p style="color: #dc2626; font-weight: bold;">⚠️ This is the final delivery of your message. The deadline has been reached.</p>' :
          '<p>Your check-in deadline is approaching. Please check in to prevent this message from being delivered.</p>'
        }
      </div>
      
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3>Message Content:</h3>
        ${message.text_content ? `<p>${message.text_content}</p>` : ''}
        ${message.content ? `<p>${message.content}</p>` : ''}
        
        ${message.share_location && message.location_name ? 
          `<p><strong>Location:</strong> ${message.location_name}</p>` : ''
        }
      </div>
      
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        <p>This message was sent automatically by DeadManSwitch. If you believe this was sent in error, please contact the sender.</p>
        <p>Reminder scheduled for: ${new Date(reminder.scheduled_at).toLocaleString()}</p>
      </div>
    </div>
  `;
}
