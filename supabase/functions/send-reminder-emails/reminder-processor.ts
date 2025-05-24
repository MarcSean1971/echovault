
import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";
import { sendWhatsAppMessage } from "../shared/services/whatsapp-service.ts";

/**
 * Enhanced reminder processor with timeout handling and proper status management
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<{ processedCount: number; successCount: number; failureCount: number }> {
  const results = {
    processedCount: 0,
    successCount: 0,
    failureCount: 0
  };

  try {
    console.log(`[REMINDER-PROCESSOR] Starting processing for ${messageId ? `message ${messageId}` : 'all messages'}`);
    console.log(`[REMINDER-PROCESSOR] Force send: ${forceSend}, Debug: ${debug}`);
    
    const supabase = supabaseClient();
    
    // CRITICAL FIX: Use database function to atomically acquire reminders
    // This prevents multiple processes from grabbing the same reminders
    let acquiredReminders;
    
    if (messageId) {
      // Acquire reminders for specific message
      const { data, error } = await supabase.rpc('acquire_message_reminders', {
        target_message_id: messageId,
        max_reminders: 10
      });
      
      if (error) {
        console.error("[REMINDER-PROCESSOR] Error acquiring message reminders:", error);
        throw error;
      }
      
      acquiredReminders = data || [];
    } else {
      // Acquire due reminders across all messages
      const { data, error } = await supabase.rpc('acquire_due_reminders', {
        max_reminders: 50,
        message_filter: null
      });
      
      if (error) {
        console.error("[REMINDER-PROCESSOR] Error acquiring due reminders:", error);
        throw error;
      }
      
      acquiredReminders = data || [];
    }
    
    console.log(`[REMINDER-PROCESSOR] Acquired ${acquiredReminders.length} reminders for processing`);
    
    if (acquiredReminders.length === 0) {
      return results;
    }
    
    // Process each acquired reminder with timeout protection
    for (const reminder of acquiredReminders) {
      results.processedCount++;
      
      try {
        console.log(`[REMINDER-PROCESSOR] Processing reminder ${reminder.id} for message ${reminder.message_id}`);
        
        // CRITICAL FIX: Add timeout wrapper to prevent infinite processing
        const processed = await processReminderWithTimeout(reminder, forceSend, debug);
        
        if (processed) {
          results.successCount++;
          console.log(`[REMINDER-PROCESSOR] Successfully processed reminder ${reminder.id}`);
        } else {
          results.failureCount++;
          console.log(`[REMINDER-PROCESSOR] Failed to process reminder ${reminder.id}`);
        }
        
      } catch (error) {
        results.failureCount++;
        console.error(`[REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
        
        // CRITICAL FIX: Always update status on error to prevent stuck reminders
        await updateReminderStatus(reminder.id, 'failed', error.message);
      }
    }
    
    console.log(`[REMINDER-PROCESSOR] Processing complete. Processed: ${results.processedCount}, Success: ${results.successCount}, Failed: ${results.failureCount}`);
    
    return results;
    
  } catch (error) {
    console.error("[REMINDER-PROCESSOR] Fatal error in processDueReminders:", error);
    throw error;
  }
}

/**
 * Process a single reminder with timeout protection
 */
async function processReminderWithTimeout(
  reminder: any,
  forceSend: boolean,
  debug: boolean,
  timeoutMs: number = 30000 // 30 second timeout
): Promise<boolean> {
  return new Promise(async (resolve) => {
    // Set up timeout to prevent infinite processing
    const timeout = setTimeout(async () => {
      console.error(`[REMINDER-PROCESSOR] Timeout processing reminder ${reminder.id}`);
      await updateReminderStatus(reminder.id, 'failed', 'Processing timeout');
      resolve(false);
    }, timeoutMs);
    
    try {
      const result = await processSingleReminder(reminder, forceSend, debug);
      clearTimeout(timeout);
      resolve(result);
    } catch (error) {
      clearTimeout(timeout);
      console.error(`[REMINDER-PROCESSOR] Error in timeout wrapper:`, error);
      await updateReminderStatus(reminder.id, 'failed', error.message);
      resolve(false);
    }
  });
}

/**
 * Process a single reminder and send notifications
 */
async function processSingleReminder(
  reminder: any,
  forceSend: boolean,
  debug: boolean
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Get message and condition details
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        message_conditions!inner(*)
      `)
      .eq('id', reminder.message_id)
      .single();
    
    if (messageError || !messageData) {
      console.error(`[REMINDER-PROCESSOR] Error fetching message ${reminder.message_id}:`, messageError);
      throw new Error(`Message not found: ${reminder.message_id}`);
    }
    
    const message = messageData;
    const condition = messageData.message_conditions[0];
    
    console.log(`[REMINDER-PROCESSOR] Processing reminder for message "${message.title}"`);
    
    // CRITICAL FIX: Determine correct recipients based on condition type
    let recipients = [];
    
    if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
      // For check-in conditions, send reminder to the message creator
      console.log(`[REMINDER-PROCESSOR] Check-in reminder - sending to creator ${message.user_id}`);
      
      // Get creator's profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', message.user_id)
        .single();
      
      if (profile) {
        recipients = [{
          email: profile.backup_email || `${message.user_id}@example.com`, // Fallback if no email
          name: `${profile.first_name} ${profile.last_name}`.trim() || 'User',
          phone: profile.whatsapp_number
        }];
      }
    } else {
      // For other conditions, use configured recipients
      recipients = condition.recipients || [];
    }
    
    if (recipients.length === 0) {
      console.warn(`[REMINDER-PROCESSOR] No recipients found for reminder ${reminder.id}`);
      await updateReminderStatus(reminder.id, 'failed', 'No recipients configured');
      return false;
    }
    
    console.log(`[REMINDER-PROCESSOR] Sending to ${recipients.length} recipients`);
    
    // Send notifications to all recipients
    let allSuccessful = true;
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Log delivery attempt
        await logDeliveryAttempt(reminder, recipient, i + 1);
        
        // Send email notification
        if (recipient.email) {
          console.log(`[REMINDER-PROCESSOR] Sending email to ${recipient.email}`);
          
          const emailResult = await sendEmail({
            to: recipient.email,
            subject: `Reminder: ${message.title}`,
            html: generateReminderEmailContent(message, condition, reminder),
            from: 'notifications@yourdomain.com'
          });
          
          if (!emailResult.success) {
            console.error(`[REMINDER-PROCESSOR] Email failed for ${recipient.email}:`, emailResult.error);
            allSuccessful = false;
          } else {
            console.log(`[REMINDER-PROCESSOR] Email sent successfully to ${recipient.email}`);
          }
        }
        
        // Send WhatsApp notification if phone number available
        if (recipient.phone) {
          console.log(`[REMINDER-PROCESSOR] Sending WhatsApp to ${recipient.phone}`);
          
          const whatsappResult = await sendWhatsAppMessage({
            to: recipient.phone,
            message: generateReminderWhatsAppContent(message, condition, reminder)
          });
          
          if (!whatsappResult.success) {
            console.error(`[REMINDER-PROCESSOR] WhatsApp failed for ${recipient.phone}:`, whatsappResult.error);
            // Don't mark as failed if email succeeded
          } else {
            console.log(`[REMINDER-PROCESSOR] WhatsApp sent successfully to ${recipient.phone}`);
          }
        }
        
      } catch (error) {
        console.error(`[REMINDER-PROCESSOR] Error sending to recipient ${recipient.email}:`, error);
        allSuccessful = false;
      }
    }
    
    // CRITICAL FIX: Always update status to prevent stuck reminders
    if (allSuccessful) {
      await updateReminderStatus(reminder.id, 'sent', null);
      console.log(`[REMINDER-PROCESSOR] Reminder ${reminder.id} completed successfully`);
      return true;
    } else {
      await updateReminderStatus(reminder.id, 'failed', 'Some deliveries failed');
      console.log(`[REMINDER-PROCESSOR] Reminder ${reminder.id} completed with failures`);
      return false;
    }
    
  } catch (error) {
    console.error(`[REMINDER-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
    throw error;
  }
}

/**
 * Update reminder status with proper error handling
 */
async function updateReminderStatus(reminderId: string, status: string, errorMessage?: string): Promise<void> {
  try {
    const supabase = supabaseClient();
    
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'failed' && errorMessage) {
      updateData.retry_count = 0; // Reset retry count on failure
    }
    
    const { error } = await supabase
      .from('reminder_schedule')
      .update(updateData)
      .eq('id', reminderId);
    
    if (error) {
      console.error(`[REMINDER-PROCESSOR] Error updating reminder status:`, error);
      // Don't throw here as it would cause infinite loops
    }
  } catch (error) {
    console.error(`[REMINDER-PROCESSOR] Exception updating reminder status:`, error);
    // Don't throw here as it would cause infinite loops
  }
}

/**
 * Log delivery attempt for tracking
 */
async function logDeliveryAttempt(reminder: any, recipient: any, channelOrder: number): Promise<void> {
  try {
    const supabase = supabaseClient();
    
    await supabase
      .from('reminder_delivery_log')
      .insert({
        reminder_id: reminder.id,
        message_id: reminder.message_id,
        condition_id: reminder.condition_id,
        recipient: recipient.email || recipient.phone || 'unknown',
        delivery_channel: 'email',
        channel_order: channelOrder,
        delivery_status: 'processing',
        response_data: { 
          recipient_name: recipient.name,
          reminder_type: reminder.reminder_type,
          scheduled_at: reminder.scheduled_at
        }
      });
  } catch (error) {
    console.error("[REMINDER-PROCESSOR] Error logging delivery attempt:", error);
    // Non-fatal, continue processing
  }
}

/**
 * Generate email content for reminders
 */
function generateReminderEmailContent(message: any, condition: any, reminder: any): string {
  const isCheckIn = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
  
  if (isCheckIn) {
    const deadline = condition.last_checked ? 
      new Date(new Date(condition.last_checked).getTime() + (condition.hours_threshold * 60 * 60 * 1000) + ((condition.minutes_threshold || 0) * 60 * 1000)) :
      null;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Check-in Reminder</h2>
        <p>This is a reminder that you need to check in for your message:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${message.title}</h3>
          <p style="margin: 0; color: #4b5563;">${message.content || message.text_content || ''}</p>
        </div>
        ${deadline ? `<p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>` : ''}
        ${condition.check_in_code ? `<p><strong>Check-in Code:</strong> ${condition.check_in_code}</p>` : ''}
        <p>If you don't check in by the deadline, your message will be automatically delivered.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated reminder from your deadman's switch system.</p>
      </div>
    `;
  } else {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Message Reminder</h2>
        <p>This is a reminder about your scheduled message:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${message.title}</h3>
          <p style="margin: 0; color: #4b5563;">${message.content || message.text_content || ''}</p>
        </div>
        <p>Scheduled for: ${new Date(reminder.scheduled_at).toLocaleString()}</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated reminder from your messaging system.</p>
      </div>
    `;
  }
}

/**
 * Generate WhatsApp content for reminders
 */
function generateReminderWhatsAppContent(message: any, condition: any, reminder: any): string {
  const isCheckIn = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
  
  if (isCheckIn) {
    const deadline = condition.last_checked ? 
      new Date(new Date(condition.last_checked).getTime() + (condition.hours_threshold * 60 * 60 * 1000) + ((condition.minutes_threshold || 0) * 60 * 1000)) :
      null;
    
    return `🚨 CHECK-IN REMINDER\n\nMessage: ${message.title}\n${deadline ? `Deadline: ${deadline.toLocaleString()}\n` : ''}${condition.check_in_code ? `Code: ${condition.check_in_code}\n` : ''}\nPlease check in to prevent automatic delivery.`;
  } else {
    return `⏰ REMINDER\n\nMessage: ${message.title}\nScheduled: ${new Date(reminder.scheduled_at).toLocaleString()}\n\n${message.content || message.text_content || ''}`;
  }
}
