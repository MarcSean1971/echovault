import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";

/**
 * FIXED: Enhanced reminder processor with proper recipient logic for different reminder types
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
    
    // Step 2: Acquire due reminders with proper locking and TIME VALIDATION
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
    
    // CRITICAL FIX: Filter out reminders that aren't actually due yet
    const now = new Date();
    const actuallyDueReminders = dueReminders.filter(reminder => {
      const scheduledAt = new Date(reminder.scheduled_at);
      const isDue = scheduledAt <= now;
      if (!isDue) {
        console.log(`[REMINDER-PROCESSOR] Reminder ${reminder.id} not yet due: scheduled for ${scheduledAt.toISOString()}, current time ${now.toISOString()}`);
      }
      return isDue || forceSend;
    });
    
    console.log(`[REMINDER-PROCESSOR] Found ${dueReminders.length} acquired reminders, ${actuallyDueReminders.length} actually due`);
    
    if (actuallyDueReminders.length === 0) {
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
    
    for (const reminder of actuallyDueReminders) {
      try {
        console.log(`[REMINDER-PROCESSOR] Processing reminder ${reminder.id} for message ${reminder.message_id}, type: ${reminder.reminder_type}`);
        
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
    
    console.log(`[REMINDER-PROCESSOR] Processing complete. Processed: ${actuallyDueReminders.length}, Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
      processedCount: actuallyDueReminders.length,
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
 * FIXED: Process an individual reminder with proper recipient logic
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
    
    // CRITICAL FIX: Determine recipients based on reminder type and condition type
    let recipients = [];
    const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    
    if (isCheckInCondition && reminder.reminder_type === 'reminder') {
      // FIXED: For check-in reminders, send ONLY to the message creator
      console.log(`[REMINDER-PROCESSOR] Check-in reminder - sending to creator only for message ${reminder.message_id}`);
      
      // Get user profile and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', messageData.user_id)
        .single();
        
      if (profile) {
        // Get user email from auth
        const { data: { user } } = await supabase.auth.admin.getUserById(messageData.user_id);
        if (user?.email) {
          recipients.push({
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
            email: user.email,
            phone: profile.whatsapp_number
          });
          console.log(`[REMINDER-PROCESSOR] Added creator ${user.email} as recipient for check-in reminder`);
        }
      }
    } else {
      // FIXED: For final delivery or non-check-in conditions, use configured recipients
      console.log(`[REMINDER-PROCESSOR] Final delivery or non-check-in condition - sending to all configured recipients for message ${reminder.message_id}`);
      
      if (!condition.recipients) {
        throw new Error('No recipients found in condition');
      }
      
      recipients = Array.isArray(condition.recipients) ? condition.recipients : [condition.recipients];
    }
    
    if (recipients.length === 0) {
      throw new Error('No valid recipients determined');
    }
    
    console.log(`[REMINDER-PROCESSOR] Processing ${recipients.length} recipients for reminder ${reminder.id}, type: ${reminder.reminder_type}`);
    
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
        console.log(`[REMINDER-PROCESSOR] Sending ${reminder.reminder_type} email to ${recipient.email} for condition ${condition.condition_type}`);
        
        // FIXED: Generate proper subject and content based on reminder type and condition
        const emailSubject = generateEmailSubject(messageData, condition, reminder);
        const emailHtml = generateReminderEmailHtml(messageData, condition, reminder);
        
        const emailResult = await sendEmail({
          to: recipient.email,
          subject: emailSubject,
          html: emailHtml,
          from: "EchoVault <notifications@echo-vault.app>"
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
            reminderType: reminder.reminder_type,
            conditionType: condition.condition_type,
            emailLength: emailHtml.length
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
 * FIXED: Generate proper email subject based on reminder type and condition
 */
function generateEmailSubject(message: any, condition: any, reminder: any): string {
  const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
  
  if (isCheckInCondition && reminder.reminder_type === 'reminder') {
    return `Check-in Reminder: ${message.title}`;
  } else if (reminder.reminder_type === 'final_delivery') {
    return `URGENT: ${message.title} - Final Notification`;
  } else {
    return `Reminder: ${message.title}`;
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
 * FIXED: Generate HTML content for reminder emails with proper context
 */
function generateReminderEmailHtml(message: any, condition: any, reminder: any): string {
  const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
  const isFinalDelivery = reminder.reminder_type === 'final_delivery';
  
  let reminderTypeText = 'REMINDER';
  let mainMessage = '';
  let urgencyColor = '#dc2626';
  
  if (isCheckInCondition && !isFinalDelivery) {
    reminderTypeText = 'CHECK-IN REMINDER';
    mainMessage = 'This is a reminder that you need to check in to prevent your deadman\'s switch message from being delivered.';
    urgencyColor = '#f59e0b'; // amber for check-in reminders
  } else if (isFinalDelivery) {
    reminderTypeText = 'FINAL DELIVERY';
    mainMessage = '⚠️ This is the final delivery of your message. The deadline has been reached.';
  } else {
    mainMessage = 'Your check-in deadline is approaching. Please check in to prevent this message from being delivered.';
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${urgencyColor};">${reminderTypeText}: ${message.title}</h2>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>This is an automated ${reminderTypeText.toLowerCase()} from your DeadManSwitch message.</strong></p>
        <p>${mainMessage}</p>
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
        <p>Condition type: ${condition.condition_type.replace('_', ' ')}</p>
      </div>
    </div>
  `;
}
