
import { supabaseClient } from "../supabase-client.ts";
import { sendEmail } from "../email-service.ts";

interface ReminderProcessResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * CRITICAL FIX: Enhanced reminder processor with comprehensive logging
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<ReminderProcessResult> {
  
  const supabase = supabaseClient();
  const result: ReminderProcessResult = {
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    errors: []
  };
  
  try {
    console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Starting enhanced reminder processing`, {
      forceSend,
      debug
    });
    
    // PHASE 1: Process check-in reminders only
    console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] PHASE 1: Processing check-in reminders only`);
    
    let reminderQuery = supabase
      .from('reminder_schedule')
      .select(`
        *,
        message_conditions!inner (
          *,
          messages!inner (
            id,
            title,
            content,
            text_content,
            user_id
          )
        )
      `)
      .eq('status', 'pending')
      .eq('reminder_type', 'reminder')
      .order('scheduled_at', { ascending: true })
      .limit(50);
    
    if (messageId) {
      reminderQuery = reminderQuery.eq('message_id', messageId);
    } else if (!forceSend) {
      reminderQuery = reminderQuery.lte('scheduled_at', new Date().toISOString());
    }
    
    const { data: checkInReminders, error: fetchError } = await reminderQuery;
    
    if (fetchError) {
      console.error(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Error fetching check-in reminders:`, fetchError);
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }
    
    console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Found ${checkInReminders?.length || 0} check-in reminders to process`);
    
    if (!checkInReminders || checkInReminders.length === 0) {
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] No due check-in reminders found`);
    } else {
      // Process check-in reminders
      for (const reminder of checkInReminders) {
        try {
          console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing check-in reminder ${reminder.id}`);
          
          const processResult = await processIndividualReminder(reminder, forceSend, debug);
          
          if (processResult.success) {
            result.successCount++;
          } else {
            result.failedCount++;
            result.errors.push(processResult.error || 'Unknown error');
          }
          result.processedCount++;
          
        } catch (error: any) {
          console.error(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
          result.failedCount++;
          result.errors.push(`Reminder ${reminder.id}: ${error.message}`);
          result.processedCount++;
        }
      }
    }
    
    // Small delay between phases
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // PHASE 2: Process final delivery messages (with safeguards)
    console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] PHASE 2: Processing final delivery messages (with safeguards)`);
    
    let finalDeliveryQuery = supabase
      .from('reminder_schedule')
      .select(`
        *,
        message_conditions!inner (
          *,
          messages!inner (
            id,
            title,
            content,
            text_content,
            user_id
          )
        )
      `)
      .eq('status', 'pending')
      .eq('reminder_type', 'final_delivery')
      .order('scheduled_at', { ascending: true })
      .limit(20); // Smaller limit for final deliveries
    
    if (messageId) {
      finalDeliveryQuery = finalDeliveryQuery.eq('message_id', messageId);
    } else if (!forceSend) {
      finalDeliveryQuery = finalDeliveryQuery.lte('scheduled_at', new Date().toISOString());
    }
    
    const { data: finalDeliveryReminders, error: finalFetchError } = await finalDeliveryQuery;
    
    if (finalFetchError) {
      console.error(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Error fetching final delivery reminders:`, finalFetchError);
      result.errors.push(`Final delivery fetch error: ${finalFetchError.message}`);
    } else if (!finalDeliveryReminders || finalDeliveryReminders.length === 0) {
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] No due final delivery reminders found`);
    } else {
      // Process final delivery reminders with extra caution
      for (const reminder of finalDeliveryReminders) {
        try {
          console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing FINAL DELIVERY reminder ${reminder.id} for message ${reminder.message_id}`);
          
          const processResult = await processIndividualReminder(reminder, forceSend, debug);
          
          if (processResult.success) {
            result.successCount++;
          } else {
            result.failedCount++;
            result.errors.push(processResult.error || 'Unknown error');
          }
          result.processedCount++;
          
        } catch (error: any) {
          console.error(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Error processing final delivery ${reminder.id}:`, error);
          result.failedCount++;
          result.errors.push(`Final delivery ${reminder.id}: ${error.message}`);
          result.processedCount++;
        }
      }
    }
    
    console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Enhanced processing complete`, result);
    
    return result;
    
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Critical error in processDueReminders:`, error);
    result.errors.push(`Critical error: ${error.message}`);
    return result;
  }
}

/**
 * CRITICAL FIX: Process individual reminder with comprehensive error tracking
 */
async function processIndividualReminder(
  reminder: any,
  forceSend: boolean,
  debug: boolean
): Promise<{ success: boolean; error?: string }> {
  
  const supabase = supabaseClient();
  
  try {
    console.log(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Starting process for reminder ${reminder.id}`);
    
    // Mark as processing first
    const { error: updateError } = await supabase
      .from('reminder_schedule')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString(),
        retry_count: (reminder.retry_count || 0) + 1
      })
      .eq('id', reminder.id);
    
    if (updateError) {
      console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Error marking as processing:`, updateError);
      throw updateError;
    }
    
    const condition = reminder.message_conditions;
    const message = condition?.messages;
    const recipients = condition?.recipients || [];
    
    console.log(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Processing message "${message?.title}" with ${recipients.length} recipients`);
    
    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients found for message");
    }
    
    // Process each recipient
    let allEmailsSent = true;
    const emailResults = [];
    
    for (const recipient of recipients) {
      try {
        console.log(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Sending email to ${recipient.email}`);
        
        // CRITICAL: Log the email sending attempt BEFORE calling sendEmail
        const logEntry = {
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: recipient.email,
          delivery_channel: 'email',
          channel_order: 1,
          delivery_status: 'attempting',
          response_data: { 
            recipient_name: recipient.name,
            attempt_time: new Date().toISOString(),
            source: 'reminder-processor'
          }
        };
        
        const { error: logError } = await supabase
          .from('reminder_delivery_log')
          .insert(logEntry);
        
        if (logError) {
          console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Error logging attempt:`, logError);
        }
        
        // Prepare email content
        const subject = `⚠️ Urgent: Check-in Required - ${message?.title || 'Message'}`;
        const html = `
          <h2>⚠️ URGENT: Check-in Required</h2>
          <p>Hello ${recipient.name},</p>
          <p>This is an urgent reminder that you need to check in.</p>
          <p><strong>Message:</strong> ${message?.title}</p>
          ${message?.content ? `<p><strong>Details:</strong> ${message.content}</p>` : ''}
          <p>Please respond immediately to confirm you are safe.</p>
          <p>If you do not respond, emergency contacts will be notified.</p>
        `;
        
        // CRITICAL: Call the email service with comprehensive error handling
        const emailResult = await sendEmail({
          to: recipient.email,
          subject: subject,
          html: html,
          from: "EchoVault Emergency <notifications@echo-vault.app>"
        });
        
        console.log(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Email result for ${recipient.email}:`, emailResult);
        
        // Update the delivery log with the result
        const updateLogData = {
          delivery_status: emailResult.success ? 'sent' : 'failed',
          error_message: emailResult.error || null,
          response_data: {
            ...logEntry.response_data,
            email_result: emailResult,
            completed_time: new Date().toISOString()
          }
        };
        
        await supabase
          .from('reminder_delivery_log')
          .update(updateLogData)
          .eq('reminder_id', reminder.id)
          .eq('recipient', recipient.email)
          .eq('delivery_status', 'attempting');
        
        emailResults.push({
          recipient: recipient.email,
          success: emailResult.success,
          error: emailResult.error
        });
        
        if (!emailResult.success) {
          allEmailsSent = false;
          console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Email failed for ${recipient.email}:`, emailResult.error);
        }
        
      } catch (emailError: any) {
        console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Exception sending email to ${recipient.email}:`, emailError);
        allEmailsSent = false;
        
        // Log the exception
        await supabase
          .from('reminder_delivery_log')
          .insert({
            reminder_id: reminder.id,
            message_id: reminder.message_id,
            condition_id: reminder.condition_id,
            recipient: recipient.email,
            delivery_channel: 'email',
            delivery_status: 'failed',
            error_message: emailError.message,
            response_data: { 
              exception: emailError.toString(),
              source: 'reminder-processor-exception'
            }
          });
        
        emailResults.push({
          recipient: recipient.email,
          success: false,
          error: emailError.message
        });
      }
    }
    
    // Update reminder status based on results
    const finalStatus = allEmailsSent ? 'sent' : 'failed';
    
    const { error: finalUpdateError } = await supabase
      .from('reminder_schedule')
      .update({
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reminder.id);
    
    if (finalUpdateError) {
      console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Error updating final status:`, finalUpdateError);
    }
    
    console.log(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Completed processing reminder ${reminder.id} with status: ${finalStatus}`);
    
    return {
      success: allEmailsSent,
      error: allEmailsSent ? undefined : `Email sending failed for some recipients: ${emailResults.filter(r => !r.success).map(r => r.error).join(', ')}`
    };
    
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Critical error processing reminder ${reminder.id}:`, error);
    
    // Mark as failed
    try {
      await supabase
        .from('reminder_schedule')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
    } catch (updateError) {
      console.error(`[${new Date().toISOString()}] [INDIVIDUAL-PROCESSOR] Error marking as failed:`, updateError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}
