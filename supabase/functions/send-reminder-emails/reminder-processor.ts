
import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";

/**
 * Enhanced reminder processor with timeout protection and automatic stuck reminder detection
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<any> {
  try {
    console.log(`[REMINDER-PROCESSOR] Starting reminder processing for message: ${messageId || 'all'}`);
    
    const supabase = supabaseClient();
    
    // Step 1: Reset any stuck reminders using our new security definer function
    console.log("[REMINDER-PROCESSOR] Checking for stuck reminders...");
    const { data: resetResult, error: resetError } = await supabase.rpc('reset_stuck_reminders');
    
    if (resetError) {
      console.error("[REMINDER-PROCESSOR] Error resetting stuck reminders:", resetError);
    } else if (resetResult && resetResult[0]?.reset_count > 0) {
      console.log(`[REMINDER-PROCESSOR] Reset ${resetResult[0].reset_count} stuck reminders`);
    }
    
    // Step 2: Acquire due reminders with proper locking
    let dueReminders;
    if (messageId) {
      const { data, error } = await supabase.rpc('acquire_message_reminders', {
        target_message_id: messageId,
        max_reminders: 10
      });
      
      if (error) throw error;
      dueReminders = data || [];
    } else {
      const { data, error } = await supabase.rpc('acquire_due_reminders', {
        max_reminders: forceSend ? 100 : 20,
        message_filter: null
      });
      
      if (error) throw error;
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
    
    // Step 3: Process each reminder with timeout protection
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const reminder of dueReminders) {
      try {
        console.log(`[REMINDER-PROCESSOR] Processing reminder ${reminder.id} for message ${reminder.message_id}`);
        
        // Set a processing timeout of 30 seconds per reminder
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Processing timeout')), 30000);
        });
        
        const processingPromise = processIndividualReminder(reminder, debug);
        
        const result = await Promise.race([processingPromise, timeoutPromise]);
        
        if (result.success) {
          successCount++;
          console.log(`[REMINDER-PROCESSOR] Successfully processed reminder ${reminder.id}`);
        } else {
          failedCount++;
          console.error(`[REMINDER-PROCESSOR] Failed to process reminder ${reminder.id}:`, result.error);
        }
        
        results.push(result);
        
      } catch (error) {
        console.error(`[REMINDER-PROCESSOR] Exception processing reminder ${reminder.id}:`, error);
        failedCount++;
        
        // Mark reminder as failed if it times out or crashes
        try {
          await supabase
            .from('reminder_schedule')
            .update({
              status: 'failed',
              retry_count: (reminder.retry_count || 0) + 1,
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', reminder.id);
        } catch (updateError) {
          console.error(`[REMINDER-PROCESSOR] Failed to update failed reminder ${reminder.id}:`, updateError);
        }
        
        results.push({
          reminderId: reminder.id,
          success: false,
          error: error.message || 'Processing timeout or crash'
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
    
  } catch (error) {
    console.error("[REMINDER-PROCESSOR] Error in processDueReminders:", error);
    throw error;
  }
}

/**
 * Process an individual reminder with proper error handling
 */
async function processIndividualReminder(reminder: any, debug: boolean = false): Promise<any> {
  const supabase = supabaseClient();
  
  try {
    // Get message and condition details
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
    
    if (messageError || !messageData) {
      throw new Error(`Failed to fetch message data: ${messageError?.message}`);
    }
    
    const condition = messageData.message_conditions[0];
    if (!condition || !condition.recipients) {
      throw new Error('No condition or recipients found for message');
    }
    
    // Process recipients
    const recipients = Array.isArray(condition.recipients) ? condition.recipients : [condition.recipients];
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const recipient of recipients) {
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
        } else {
          emailsFailed++;
          console.error(`[REMINDER-PROCESSOR] Email failed for ${recipient.email}:`, emailResult.error);
        }
        
        // Log delivery attempt
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: recipient.email,
          delivery_channel: 'email',
          delivery_status: emailResult.success ? 'delivered' : 'failed',
          error_message: emailResult.error,
          response_data: emailResult
        });
        
      } catch (recipientError) {
        console.error(`[REMINDER-PROCESSOR] Error sending to ${recipient.email}:`, recipientError);
        emailsFailed++;
      }
    }
    
    // Update reminder status based on results
    const finalStatus = emailsSent > 0 ? 'sent' : 'failed';
    
    await supabase
      .from('reminder_schedule')
      .update({
        status: finalStatus,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reminder.id);
    
    // Add to sent_reminders table if successful
    if (finalStatus === 'sent') {
      await supabase.from('sent_reminders').insert({
        message_id: reminder.message_id,
        condition_id: reminder.condition_id,
        user_id: messageData.user_id,
        deadline: condition.trigger_date || new Date().toISOString(),
        scheduled_for: reminder.scheduled_at,
        sent_at: new Date().toISOString()
      });
    }
    
    return {
      reminderId: reminder.id,
      success: finalStatus === 'sent',
      emailsSent,
      emailsFailed,
      error: finalStatus === 'failed' ? 'All email deliveries failed' : null
    };
    
  } catch (error) {
    console.error(`[REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
    
    // Mark as failed in database
    try {
      await supabase
        .from('reminder_schedule')
        .update({
          status: 'failed',
          retry_count: (reminder.retry_count || 0) + 1,
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
    } catch (updateError) {
      console.error(`[REMINDER-PROCESSOR] Failed to mark reminder as failed:`, updateError);
    }
    
    return {
      reminderId: reminder.id,
      success: false,
      error: error.message || 'Unknown error'
    };
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
