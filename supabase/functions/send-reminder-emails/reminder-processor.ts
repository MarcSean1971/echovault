import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";
import { sendCheckInWhatsAppToCreator } from "./services/whatsapp-sender.ts";

/**
 * FIXED: Enhanced reminder processor with CORRECT recipient logic for different reminder types
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
 * ENHANCED: Process an individual reminder with DUAL-CHANNEL DELIVERY (Email + WhatsApp)
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
    
    // CRITICAL FIX: Determine if this is an actual deadline delivery or just a check-in reminder
    let recipients = [];
    const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    
    if (isCheckInCondition) {
      // CRITICAL DECISION: For check-in conditions, we need to check if this is the ACTUAL deadline
      const now = new Date();
      const lastChecked = new Date(condition.last_checked);
      const actualDeadline = new Date(lastChecked);
      actualDeadline.setHours(actualDeadline.getHours() + (condition.hours_threshold || 0));
      actualDeadline.setMinutes(actualDeadline.getMinutes() + (condition.minutes_threshold || 0));
      
      const isActualDeadline = Math.abs(new Date(reminder.scheduled_at).getTime() - actualDeadline.getTime()) < 60000; // Within 1 minute
      
      if (isActualDeadline && reminder.reminder_type === 'final_delivery') {
        // FINAL DELIVERY: Send to all configured recipients
        console.log(`[REMINDER-PROCESSOR] FINAL DELIVERY for check-in condition - sending to all recipients for message ${reminder.message_id}`);
        
        if (!condition.recipients) {
          throw new Error('No recipients found in condition for final delivery');
        }
        
        recipients = Array.isArray(condition.recipients) ? condition.recipients : [condition.recipients];
      } else {
        // CHECK-IN REMINDER: Send ONLY to the message creator
        console.log(`[REMINDER-PROCESSOR] Check-in reminder - sending to creator only for message ${reminder.message_id}`);
        
        // Get user profile with both email and phone
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
              phone: profile.whatsapp_number // RESTORED: Include phone number for WhatsApp
            });
            console.log(`[REMINDER-PROCESSOR] Added creator ${user.email} with phone ${profile.whatsapp_number || 'none'} as recipient for check-in reminder`);
          }
        }
      }
    } else {
      // NON-CHECK-IN CONDITIONS: Always use configured recipients
      console.log(`[REMINDER-PROCESSOR] Non-check-in condition - sending to all configured recipients for message ${reminder.message_id}`);
      
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
    let whatsappSent = 0;
    let whatsappFailed = 0;
    const deliveryResults = [];
    
    for (const recipient of recipients) {
      if (!recipient.email) {
        console.warn(`[REMINDER-PROCESSOR] Skipping recipient with no email:`, recipient);
        emailsFailed++;
        continue;
      }
      
      // DUAL CHANNEL DELIVERY: EMAIL + WHATSAPP
      let emailSuccess = false;
      let whatsappSuccess = false;
      
      // Send EMAIL
      try {
        console.log(`[REMINDER-PROCESSOR] Sending ${reminder.reminder_type} email to ${recipient.email} for condition ${condition.condition_type}`);
        
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
          emailSuccess = true;
          console.log(`[REMINDER-PROCESSOR] Email sent successfully to ${recipient.email}, messageId: ${emailResult.messageId}`);
        } else {
          emailsFailed++;
          console.error(`[REMINDER-PROCESSOR] Email failed for ${recipient.email}:`, emailResult.error);
        }
        
        deliveryResults.push({
          recipient: recipient.email,
          channel: 'email',
          success: emailResult.success,
          error: emailResult.error,
          messageId: emailResult.messageId
        });
        
        // Log email delivery attempt
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
            conditionType: condition.condition_type
          }
        });
        
      } catch (emailError: any) {
        console.error(`[REMINDER-PROCESSOR] Error sending email to ${recipient.email}:`, emailError);
        emailsFailed++;
        deliveryResults.push({
          recipient: recipient.email,
          channel: 'email',
          success: false,
          error: emailError.message || 'Unknown error'
        });
      }
      
      // Send WHATSAPP (if phone number available)
      if (recipient.phone) {
        try {
          console.log(`[REMINDER-PROCESSOR] Sending ${reminder.reminder_type} WhatsApp to ${recipient.phone} for condition ${condition.condition_type}`);
          
          // Calculate time until deadline for WhatsApp message
          const now = new Date();
          const lastChecked = new Date(condition.last_checked);
          const deadline = new Date(lastChecked);
          deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
          deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
          
          const diffMs = deadline.getTime() - now.getTime();
          const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
          
          const whatsappResult = await sendCheckInWhatsAppToCreator(
            recipient.phone,
            messageData.title,
            messageData.id,
            diffHours
          );
          
          if (whatsappResult.success) {
            whatsappSent++;
            whatsappSuccess = true;
            console.log(`[REMINDER-PROCESSOR] WhatsApp sent successfully to ${recipient.phone}, messageId: ${whatsappResult.messageId}`);
          } else {
            whatsappFailed++;
            console.error(`[REMINDER-PROCESSOR] WhatsApp failed for ${recipient.phone}:`, whatsappResult.error);
          }
          
          deliveryResults.push({
            recipient: recipient.phone,
            channel: 'whatsapp',
            success: whatsappResult.success,
            error: whatsappResult.error,
            messageId: whatsappResult.messageId
          });
          
          // Log WhatsApp delivery attempt
          await supabase.from('reminder_delivery_log').insert({
            reminder_id: reminder.id,
            message_id: reminder.message_id,
            condition_id: reminder.condition_id,
            recipient: recipient.phone,
            delivery_channel: 'whatsapp',
            delivery_status: whatsappResult.success ? 'delivered' : 'failed',
            error_message: whatsappResult.error || null,
            response_data: {
              messageId: whatsappResult.messageId,
              timestamp: new Date().toISOString(),
              reminderType: reminder.reminder_type,
              conditionType: condition.condition_type,
              hoursUntilDeadline: diffHours
            }
          });
          
        } catch (whatsappError: any) {
          console.error(`[REMINDER-PROCESSOR] Error sending WhatsApp to ${recipient.phone}:`, whatsappError);
          whatsappFailed++;
          deliveryResults.push({
            recipient: recipient.phone,
            channel: 'whatsapp',
            success: false,
            error: whatsappError.message || 'Unknown error'
          });
        }
      } else {
        console.log(`[REMINDER-PROCESSOR] No phone number for ${recipient.email}, skipping WhatsApp`);
      }
    }
    
    // ENHANCED SUCCESS LOGIC: Consider reminder successful if EITHER email OR WhatsApp was delivered
    const totalSuccessfulDeliveries = emailsSent + whatsappSent;
    const finalStatus = totalSuccessfulDeliveries > 0 ? 'sent' : 'failed';
    const finalError = totalSuccessfulDeliveries === 0 ? 'All delivery channels failed' : null;
    
    console.log(`[REMINDER-PROCESSOR] Delivery summary for reminder ${reminder.id}: Email ${emailsSent}/${emailsSent + emailsFailed}, WhatsApp ${whatsappSent}/${whatsappSent + whatsappFailed}, Overall status: ${finalStatus}`);
    
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
      whatsappSent,
      whatsappFailed,
      totalDeliveries: totalSuccessfulDeliveries,
      deliveryResults,
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
    return `Check-in Required: ${message.title}`;
  } else if (reminder.reminder_type === 'final_delivery') {
    return `Message Delivered: ${message.title}`;
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
 * REDESIGNED: Generate beautiful HTML content for check-in reminder emails
 */
function generateReminderEmailHtml(message: any, condition: any, reminder: any): string {
  const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
  const isFinalDelivery = reminder.reminder_type === 'final_delivery';
  
  // Calculate time until deadline for check-in reminders
  let timeUntilDeadline = '';
  if (isCheckInCondition && !isFinalDelivery) {
    const now = new Date();
    const lastChecked = new Date(condition.last_checked);
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
    deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
    
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      timeUntilDeadline = `${diffHours} hour${diffHours !== 1 ? 's' : ''}${diffMinutes > 0 ? ` and ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}` : ''}`;
    } else if (diffMinutes > 0) {
      timeUntilDeadline = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else {
      timeUntilDeadline = 'less than 1 minute';
    }
  }
  
  if (isCheckInCondition && !isFinalDelivery) {
    // REDESIGNED CHECK-IN REMINDER EMAIL
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-in Required</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #9b87f5 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px 24px;
          }
          .alert-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
          }
          .alert-box .time {
            font-size: 20px;
            font-weight: 700;
            color: #d97706;
            margin-bottom: 8px;
          }
          .message-title {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-weight: 500;
            border-left: 4px solid #9b87f5;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #9b87f5 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
            box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.25);
          }
          .footer {
            background: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Check-in Required</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            
            <p>This is a reminder that you need to check in to prevent your message from being delivered.</p>
            
            <div class="message-title">
              <strong>Message:</strong> ${message.title}
            </div>
            
            <div class="alert-box">
              <div class="time">Time remaining: ${timeUntilDeadline}</div>
              <p>Your message will be delivered automatically if you don't check in before the deadline.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://echo-vault.app/messages" class="cta-button">Check In Now</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
              If you're unable to click the button, please visit: <br>
              <strong>https://echo-vault.app/messages</strong>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from EchoVault.<br>
            © ${new Date().getFullYear()} EchoVault - Secure Message Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (isFinalDelivery) {
    // FINAL DELIVERY EMAIL
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Delivered</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px 24px;
          }
          .message-content {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #dc2626;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📨 Message Delivered</h1>
          </div>
          <div class="content">
            <p><strong>Hello,</strong></p>
            
            <p>You have received an important message:</p>
            
            <div class="message-content">
              <h3 style="margin-top: 0; color: #dc2626;">${message.title}</h3>
              ${message.text_content ? `<p>${message.text_content}</p>` : ''}
              ${message.content ? `<p>${message.content}</p>` : ''}
              
              ${message.share_location && message.location_name ? 
                `<p><strong>Location:</strong> ${message.location_name}</p>` : ''
              }
            </div>
          </div>
          <div class="footer">
            <p>This message was delivered automatically by EchoVault.<br>
            © ${new Date().getFullYear()} EchoVault - Secure Message Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // STANDARD REMINDER EMAIL
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reminder</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #9b87f5 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px 24px;
          }
          .message-content {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #9b87f5;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Reminder</h1>
          </div>
          <div class="content">
            <p><strong>Hello,</strong></p>
            
            <p>This is a reminder about:</p>
            
            <div class="message-content">
              <h3 style="margin-top: 0; color: #9b87f5;">${message.title}</h3>
              ${message.text_content ? `<p>${message.text_content}</p>` : ''}
              ${message.content ? `<p>${message.content}</p>` : ''}
              
              ${message.share_location && message.location_name ? 
                `<p><strong>Location:</strong> ${message.location_name}</p>` : ''
              }
            </div>
          </div>
          <div class="footer">
            <p>This is an automated reminder from EchoVault.<br>
            © ${new Date().getFullYear()} EchoVault - Secure Message Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
