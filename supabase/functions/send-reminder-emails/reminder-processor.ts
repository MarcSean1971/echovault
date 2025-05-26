import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";
import { sendCheckInWhatsAppToCreator } from "./services/whatsapp-sender.ts";

/**
 * ENHANCED: Dual-channel reminder processor with proper status management
 * This processor handles both email and WhatsApp delivery and manages final reminder status
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<any> {
  try {
    console.log(`[DUAL-CHANNEL-PROCESSOR] Starting enhanced reminder processing for message: ${messageId || 'all'}`);
    
    const supabase = supabaseClient();
    
    // Step 1: Clean up any genuinely stuck reminders first
    console.log("[DUAL-CHANNEL-PROCESSOR] Cleaning up stuck reminders...");
    await cleanupStuckReminders(supabase, debug);
    
    // Step 2: Acquire due reminders with proper filtering
    let dueReminders;
    if (messageId) {
      const { data, error } = await supabase.rpc('acquire_message_reminders', {
        target_message_id: messageId,
        max_reminders: 10
      });
      
      if (error) {
        console.error("[DUAL-CHANNEL-PROCESSOR] Error acquiring message reminders:", error);
        throw error;
      }
      dueReminders = data || [];
    } else {
      const { data, error } = await supabase.rpc('acquire_due_reminders', {
        max_reminders: forceSend ? 100 : 20,
        message_filter: null
      });
      
      if (error) {
        console.error("[DUAL-CHANNEL-PROCESSOR] Error acquiring due reminders:", error);
        throw error;
      }
      dueReminders = data || [];
    }
    
    // CRITICAL: Filter to only process reminders that haven't been fully processed
    const now = new Date();
    const actuallyDueReminders = dueReminders.filter(reminder => {
      const scheduledAt = new Date(reminder.scheduled_at);
      const isDue = scheduledAt <= now;
      
      // IMPORTANT: Only process if status is still 'pending' or 'processing'
      const shouldProcess = ['pending', 'processing'].includes(reminder.status);
      
      if (!isDue) {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Reminder ${reminder.id} not yet due: scheduled for ${scheduledAt.toISOString()}, current time ${now.toISOString()}`);
      }
      
      if (!shouldProcess) {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Reminder ${reminder.id} already processed with status: ${reminder.status}`);
      }
      
      return (isDue || forceSend) && shouldProcess;
    });
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Found ${dueReminders.length} acquired reminders, ${actuallyDueReminders.length} actually due and unprocessed`);
    
    if (actuallyDueReminders.length === 0) {
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        results: []
      };
    }
    
    // Step 3: Process each reminder with dual-channel delivery
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const reminder of actuallyDueReminders) {
      try {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Processing reminder ${reminder.id} for message ${reminder.message_id}, type: ${reminder.reminder_type}`);
        
        // Mark as processing to prevent duplicate processing
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', reminder.id);
        
        const result = await processIndividualReminderWithDualChannel(reminder, debug, supabase);
        
        if (result.success) {
          successCount++;
          console.log(`[DUAL-CHANNEL-PROCESSOR] Successfully processed reminder ${reminder.id}`);
        } else {
          failedCount++;
          console.error(`[DUAL-CHANNEL-PROCESSOR] Failed to process reminder ${reminder.id}:`, result.error);
        }
        
        results.push(result);
        
      } catch (error: any) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] Exception processing reminder ${reminder.id}:`, error);
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
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Processing complete. Processed: ${actuallyDueReminders.length}, Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
      processedCount: actuallyDueReminders.length,
      successCount,
      failedCount,
      results
    };
    
  } catch (error: any) {
    console.error("[DUAL-CHANNEL-PROCESSOR] Error in processDueReminders:", error);
    throw error;
  }
}

/**
 * NEW: Process an individual reminder with dual-channel delivery (Email + WhatsApp)
 */
async function processIndividualReminderWithDualChannel(reminder: any, debug: boolean, supabase: any): Promise<any> {
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
      throw new Error(`Failed to fetch message data: ${messageError?.message || 'Message not found'}`);
    }
    
    const condition = messageData.message_conditions?.[0];
    if (!condition) {
      throw new Error('No condition found for message');
    }
    
    // For check-in conditions, send to creator only
    const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    
    if (!isCheckInCondition || reminder.reminder_type !== 'reminder') {
      console.log(`[DUAL-CHANNEL-PROCESSOR] Skipping non-check-in reminder: ${reminder.reminder_type}, condition: ${condition.condition_type}`);
      return { success: false, error: 'Not a check-in reminder' };
    }
    
    // Get creator profile with both email and phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', messageData.user_id)
      .single();
      
    if (profileError || !profile) {
      throw new Error(`Creator profile not found: ${profileError?.message || 'Unknown error'}`);
    }
    
    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(messageData.user_id);
    if (userError || !user?.email) {
      throw new Error(`Creator email not found: ${userError?.message || 'No email'}`);
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Processing dual-channel delivery for creator ${user.email}, phone: ${profile.whatsapp_number || 'none'}`);
    
    let emailSuccess = false;
    let whatsappSuccess = false;
    const deliveryResults = [];
    
    // Calculate time until deadline for display
    const now = new Date();
    const lastChecked = new Date(condition.last_checked);
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
    deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
    
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
    
    // CHANNEL 1: EMAIL
    try {
      console.log(`[DUAL-CHANNEL-PROCESSOR] Sending check-in email to ${user.email}`);
      
      const emailSubject = `Check-in Required: ${messageData.title}`;
      const emailHtml = generateCheckInEmailHtml(messageData, condition, diffHours);
      
      const emailResult = await sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailHtml,
        from: "EchoVault <notifications@echo-vault.app>"
      });
      
      emailSuccess = emailResult.success;
      deliveryResults.push({
        recipient: user.email,
        channel: 'email',
        success: emailResult.success,
        error: emailResult.error,
        messageId: emailResult.messageId
      });
      
      console.log(`[DUAL-CHANNEL-PROCESSOR] Email result: ${emailResult.success ? 'SUCCESS' : 'FAILED'} - ${emailResult.error || emailResult.messageId}`);
      
    } catch (emailError: any) {
      console.error(`[DUAL-CHANNEL-PROCESSOR] Email error:`, emailError);
      deliveryResults.push({
        recipient: user.email,
        channel: 'email',
        success: false,
        error: emailError.message || 'Unknown error'
      });
    }
    
    // CHANNEL 2: WHATSAPP (if phone number available)
    if (profile.whatsapp_number) {
      try {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Sending check-in WhatsApp to ${profile.whatsapp_number}`);
        
        const whatsappResult = await sendCheckInWhatsAppToCreator(
          profile.whatsapp_number,
          messageData.title,
          messageData.id,
          diffHours
        );
        
        whatsappSuccess = whatsappResult.success;
        deliveryResults.push({
          recipient: profile.whatsapp_number,
          channel: 'whatsapp',
          success: whatsappResult.success,
          error: whatsappResult.error,
          messageId: whatsappResult.messageId
        });
        
        console.log(`[DUAL-CHANNEL-PROCESSOR] WhatsApp result: ${whatsappResult.success ? 'SUCCESS' : 'FAILED'} - ${whatsappResult.error || whatsappResult.messageId}`);
        
      } catch (whatsappError: any) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] WhatsApp error:`, whatsappError);
        deliveryResults.push({
          recipient: profile.whatsapp_number,
          channel: 'whatsapp',
          success: false,
          error: whatsappError.message || 'Unknown error'
        });
      }
    } else {
      console.log(`[DUAL-CHANNEL-PROCESSOR] No phone number for ${user.email}, skipping WhatsApp`);
    }
    
    // FINAL STATUS: Consider successful if EITHER email OR WhatsApp was delivered
    const totalSuccessfulDeliveries = (emailSuccess ? 1 : 0) + (whatsappSuccess ? 1 : 0);
    const finalStatus = totalSuccessfulDeliveries > 0 ? 'sent' : 'failed';
    const finalError = totalSuccessfulDeliveries === 0 ? 'All delivery channels failed' : null;
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Delivery summary for reminder ${reminder.id}: Email ${emailSuccess ? 'SUCCESS' : 'FAILED'}, WhatsApp ${whatsappSuccess ? 'SUCCESS' : 'FAILED'}, Overall status: ${finalStatus}`);
    
    // Update final reminder status
    const { error: updateError } = await supabase
      .from('reminder_schedule')
      .update({
        status: finalStatus,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reminder.id);
    
    if (updateError) {
      console.error(`[DUAL-CHANNEL-PROCESSOR] Error updating reminder status:`, updateError);
    }
    
    // Log all delivery attempts
    for (const result of deliveryResults) {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: reminder.id,
        message_id: reminder.message_id,
        condition_id: reminder.condition_id,
        recipient: result.recipient,
        delivery_channel: result.channel,
        delivery_status: result.success ? 'delivered' : 'failed',
        error_message: result.error || null,
        response_data: {
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
          reminderType: reminder.reminder_type,
          conditionType: condition.condition_type,
          hoursUntilDeadline: diffHours
        }
      });
    }
    
    return {
      reminderId: reminder.id,
      success: finalStatus === 'sent',
      emailSuccess,
      whatsappSuccess,
      totalDeliveries: totalSuccessfulDeliveries,
      deliveryResults,
      error: finalError
    };
    
  } catch (error: any) {
    console.error(`[DUAL-CHANNEL-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
    await markReminderAsFailed(supabase, reminder.id, error.message || 'Unknown error', false);
    
    return {
      reminderId: reminder.id,
      success: false,
      error: error.message || 'Unknown error'
    };
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
 * Generate check-in reminder email HTML
 */
function generateCheckInEmailHtml(message: any, condition: any, hoursUntilDeadline: number): string {
  const timeDisplay = hoursUntilDeadline > 1 
    ? `${hoursUntilDeadline.toFixed(1)} hours`
    : hoursUntilDeadline > 0 
      ? `${Math.ceil(hoursUntilDeadline * 60)} minutes`
      : 'less than 1 minute';

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
            <div class="time">Time remaining: ${timeDisplay}</div>
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
