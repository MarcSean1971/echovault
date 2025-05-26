import { supabaseClient } from "./supabase-client.ts";
import { formatTimeUntilDeadline } from "./utils/format-utils.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";

/**
 * FIXED: Process a single reminder with improved logic for check-in vs final delivery
 */
export async function processReminder(reminder: any, debug: boolean = false): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    if (debug) {
      console.log(`Processing reminder ${reminder.id} for message ${reminder.message_id}`);
    }
    
    // Get message and condition details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*, message_conditions!inner(*)')
      .eq('id', reminder.message_id)
      .single();
    
    if (messageError || !message) {
      console.error(`Error fetching message ${reminder.message_id}:`, messageError);
      return { success: false, error: 'Message not found' };
    }
    
    const condition = message.message_conditions[0];
    if (!condition) {
      console.error(`No condition found for message ${reminder.message_id}`);
      return { success: false, error: 'Condition not found' };
    }
    
    // Calculate deadline and time until deadline
    let effectiveDeadline: Date;
    
    if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
      // For check-in conditions, calculate virtual deadline
      const lastChecked = new Date(condition.last_checked);
      effectiveDeadline = new Date(lastChecked);
      effectiveDeadline.setHours(effectiveDeadline.getHours() + (condition.hours_threshold || 0));
      effectiveDeadline.setMinutes(effectiveDeadline.getMinutes() + (condition.minutes_threshold || 0));
    } else if (condition.trigger_date) {
      effectiveDeadline = new Date(condition.trigger_date);
    } else {
      console.error(`No deadline could be determined for reminder ${reminder.id}`);
      return { success: false, error: 'No deadline available' };
    }
    
    const now = new Date();
    const hoursUntilDeadline = (effectiveDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // CRITICAL FIX: Determine if this is a check-in reminder or final delivery
    const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    const isFinalDelivery = reminder.reminder_type === 'final_delivery';
    
    if (isCheckInCondition && !isFinalDelivery) {
      // FIXED: For check-in reminders, send ONLY to the creator
      console.log(`[REMINDER-SERVICE] Processing check-in reminder for creator ${message.user_id}`);
      
      const reminderResults = await sendCreatorReminder(
        message.id,
        condition.id,
        message.title,
        message.user_id,
        hoursUntilDeadline,
        reminder.scheduled_at,
        debug
      );
      
      const successCount = reminderResults.filter(r => r.success).length;
      const errors = reminderResults.filter(r => !r.success).map(r => r.error).filter(Boolean);
      
      if (debug) {
        console.log(`Check-in reminder processed: ${successCount} successful deliveries, ${errors.length} errors`);
      }
      
      return { 
        success: successCount > 0, 
        error: errors.length > 0 ? errors.join('; ') : undefined 
      };
    } else {
      // For final delivery or non-check-in conditions, send to recipients
      console.log(`[REMINDER-SERVICE] Processing final delivery for recipients`);
      
      const recipients = condition.recipients || [];
      if (recipients.length === 0) {
        console.error(`No recipients found for final delivery ${reminder.id}`);
        return { success: false, error: 'No recipients configured' };
      }
      
      // Send to all configured recipients for final delivery
      let successCount = 0;
      let errors: string[] = [];
      
      for (const recipient of recipients) {
        try {
          // Add delay between recipients to avoid rate limiting
          if (successCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Send email notification
          if (recipient.email) {
            const emailResult = await sendEmailNotification(recipient, message, condition, formatTimeUntilDeadline(hoursUntilDeadline), 'final_delivery');
            if (emailResult.success) {
              successCount++;
            } else {
              errors.push(`Email to ${recipient.email}: ${emailResult.error}`);
            }
          }
          
          // Send WhatsApp notification if phone number available
          if (recipient.phone) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const whatsappResult = await sendWhatsAppNotification(recipient, message, condition, formatTimeUntilDeadline(hoursUntilDeadline), 'final_delivery');
            if (whatsappResult.success) {
              successCount++;
            } else {
              errors.push(`WhatsApp to ${recipient.phone}: ${whatsappResult.error}`);
            }
          }
          
        } catch (recipientError: any) {
          console.error(`Error processing recipient ${recipient.email || recipient.phone}:`, recipientError);
          errors.push(`${recipient.email || recipient.phone}: ${recipientError.message}`);
        }
      }
      
      if (debug) {
        console.log(`Final delivery processed: ${successCount} successful deliveries, ${errors.length} errors`);
      }
      
      return { 
        success: successCount > 0, 
        error: errors.length > 0 ? errors.join('; ') : undefined 
      };
    }
    
  } catch (error: any) {
    console.error(`Error processing reminder ${reminder.id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Send email notification with improved error handling
 */
async function sendEmailNotification(recipient: any, message: any, condition: any, timeUntilText: string, reminderType: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseClient();
    
    const subject = reminderType === 'final_delivery' 
      ? `URGENT: ${message.title} - Final Notification`
      : `Reminder: ${message.title} - ${timeUntilText} remaining`;
    
    const body = `
      <h2>${reminderType === 'final_delivery' ? 'FINAL NOTIFICATION' : 'Reminder'}</h2>
      <p><strong>Message:</strong> ${message.title}</p>
      <p><strong>Content:</strong> ${message.content || message.text_content || 'No content'}</p>
      <p><strong>Time remaining:</strong> ${timeUntilText}</p>
      ${reminderType === 'final_delivery' ? '<p style="color: red;"><strong>This is the final notification for this message.</strong></p>' : ''}
    `;
    
    const { error } = await supabase.functions.invoke('send-test-email', {
      body: {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        senderName: 'EchoVault',
        messageTitle: subject,
        messageContent: body
      }
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    return { success: false, error: error.message || 'Email sending failed' };
  }
}

/**
 * Send WhatsApp notification with improved error handling
 */
async function sendWhatsAppNotification(recipient: any, message: any, condition: any, timeUntilText: string, reminderType: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseClient();
    
    const whatsappMessage = reminderType === 'final_delivery'
      ? `🚨 FINAL NOTIFICATION\n\n📋 ${message.title}\n📝 ${message.content || message.text_content || 'No content'}\n⏰ Time remaining: ${timeUntilText}\n\nThis is the final notification for this message.`
      : `⏰ REMINDER\n\n📋 ${message.title}\n📝 ${message.content || message.text_content || 'No content'}\n⏰ Time remaining: ${timeUntilText}`;
    
    const { error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        to: recipient.phone,
        message: whatsappMessage
      }
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Error sending WhatsApp notification:', error);
    return { success: false, error: error.message || 'WhatsApp sending failed' };
  }
}
