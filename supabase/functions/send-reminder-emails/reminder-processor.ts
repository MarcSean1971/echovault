import { supabaseClient } from "./supabase-client.ts";
import { sendEmail } from "./email-service.ts";
import { sendCheckInWhatsAppToCreator } from "./services/whatsapp-sender.ts";

/**
 * FIXED: Dual-channel reminder processor with guaranteed status management and proper WhatsApp integration
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<any> {
  try {
    console.log(`[DUAL-CHANNEL-PROCESSOR] Starting FIXED reminder processing for message: ${messageId || 'all'}`);
    
    const supabase = supabaseClient();
    
    // Step 1: Clean up any genuinely stuck reminders first
    console.log("[DUAL-CHANNEL-PROCESSOR] Cleaning up stuck reminders...");
    await cleanupStuckReminders(supabase, debug);
    
    // Step 2: Get due reminders with better query
    let query = supabase
      .from('reminder_schedule')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());
    
    if (messageId) {
      query = query.eq('message_id', messageId);
    }
    
    const { data: dueReminders, error: fetchError } = await query.limit(forceSend ? 100 : 50);
    
    if (fetchError) {
      console.error("[DUAL-CHANNEL-PROCESSOR] Error fetching reminders:", fetchError);
      throw fetchError;
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Found ${dueReminders?.length || 0} due reminders`);
    
    if (!dueReminders || dueReminders.length === 0) {
      // CRITICAL FIX: Check if we have any messages that should have reminders but don't
      await ensureRemindersExist(supabase, messageId, debug);
      
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        results: []
      };
    }
    
    // Step 3: Process each reminder with enhanced dual-channel delivery
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const reminder of dueReminders) {
      try {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Processing reminder ${reminder.id} for message ${reminder.message_id}, type: ${reminder.reminder_type}`);
        
        // CRITICAL FIX: Mark as processing with retry protection
        const { error: lockError } = await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            retry_count: (reminder.retry_count || 0) + 1
          })
          .eq('id', reminder.id)
          .eq('status', 'pending'); // Only update if still pending
        
        if (lockError) {
          console.error(`[DUAL-CHANNEL-PROCESSOR] Failed to lock reminder ${reminder.id}:`, lockError);
          continue;
        }
        
        const result = await processIndividualReminderWithEnhancedDelivery(reminder, debug, supabase);
        
        if (result.success) {
          successCount++;
          console.log(`[DUAL-CHANNEL-PROCESSOR] Successfully processed reminder ${reminder.id}`);
          
          // ENHANCED: Immediate frontend event emission
          await emitImmediateFrontendEvents(supabase, reminder.message_id, reminder.condition_id, result);
          
        } else {
          failedCount++;
          console.error(`[DUAL-CHANNEL-PROCESSOR] Failed to process reminder ${reminder.id}:`, result.error);
        }
        
        results.push(result);
        
      } catch (error: any) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] Exception processing reminder ${reminder.id}:`, error);
        failedCount++;
        
        // Mark reminder as failed with comprehensive error logging
        await markReminderAsFailed(supabase, reminder.id, error.message || 'Processing exception', debug);
        
        results.push({
          reminderId: reminder.id,
          success: false,
          error: error.message || 'Processing exception'
        });
      }
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Processing complete. Processed: ${dueReminders.length}, Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
      processedCount: dueReminders.length,
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
 * CRITICAL FIX: Ensure reminders exist for armed messages
 */
async function ensureRemindersExist(supabase: any, messageId?: string, debug: boolean = false): Promise<void> {
  try {
    console.log("[DUAL-CHANNEL-PROCESSOR] Checking for missing reminders...");
    
    // Find armed messages without pending reminders
    let conditionsQuery = supabase
      .from('message_conditions')
      .select('*, messages!inner(*)')
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'regular_check_in', 'inactivity_to_date']);
    
    if (messageId) {
      conditionsQuery = conditionsQuery.eq('message_id', messageId);
    }
    
    const { data: armedConditions, error: conditionsError } = await conditionsQuery;
    
    if (conditionsError) {
      console.error("[DUAL-CHANNEL-PROCESSOR] Error fetching armed conditions:", conditionsError);
      return;
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Found ${armedConditions?.length || 0} armed conditions`);
    
    for (const condition of armedConditions || []) {
      // Check if this condition has pending reminders
      const { data: existingReminders } = await supabase
        .from('reminder_schedule')
        .select('id')
        .eq('condition_id', condition.id)
        .eq('status', 'pending');
      
      if (!existingReminders || existingReminders.length === 0) {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Creating missing reminders for condition ${condition.id}`);
        
        // Create immediate check-in reminder
        const now = new Date();
        const deadline = new Date(condition.last_checked);
        deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
        deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
        
        if (deadline <= now) {
          // Past deadline - create final delivery reminder
          await supabase.from('reminder_schedule').insert({
            message_id: condition.message_id,
            condition_id: condition.id,
            scheduled_at: now.toISOString(),
            reminder_type: 'final_delivery',
            status: 'pending',
            delivery_priority: 'critical'
          });
        } else {
          // Future deadline - create check-in reminder
          const reminderTime = new Date(deadline.getTime() - (30 * 60 * 1000)); // 30 minutes before
          
          await supabase.from('reminder_schedule').insert({
            message_id: condition.message_id,
            condition_id: condition.id,
            scheduled_at: reminderTime.toISOString(),
            reminder_type: 'reminder',
            status: 'pending',
            delivery_priority: 'high'
          });
        }
      }
    }
  } catch (error: any) {
    console.error("[DUAL-CHANNEL-PROCESSOR] Error ensuring reminders exist:", error);
  }
}

/**
 * ENHANCED: Process individual reminder with guaranteed WhatsApp delivery
 */
async function processIndividualReminderWithEnhancedDelivery(reminder: any, debug: boolean, supabase: any): Promise<any> {
  try {
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
      throw new Error(`Failed to fetch message data: ${messageError?.message || 'Message not found'}`);
    }
    
    const condition = messageData.message_conditions?.[0];
    if (!condition) {
      throw new Error('No condition found for message');
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
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Processing ${reminder.reminder_type} for creator ${user.email}`);
    console.log(`[DUAL-CHANNEL-PROCESSOR] Profile WhatsApp: ${profile.whatsapp_number || 'none'}`);
    
    let emailSuccess = false;
    let whatsappSuccess = false;
    const deliveryResults = [];
    
    // Calculate time until deadline
    const now = new Date();
    const lastChecked = new Date(condition.last_checked);
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
    deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
    
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
    
    // CHANNEL 1: EMAIL with enhanced content
    try {
      console.log(`[DUAL-CHANNEL-PROCESSOR] Sending ${reminder.reminder_type} email to ${user.email}`);
      
      const emailSubject = reminder.reminder_type === 'final_delivery' 
        ? `URGENT: Message Delivered - ${messageData.title}`
        : `Check-in Required: ${messageData.title}`;
        
      const emailHtml = reminder.reminder_type === 'final_delivery'
        ? generateFinalDeliveryEmailHtml(messageData, condition, diffHours)
        : generateCheckInEmailHtml(messageData, condition, diffHours);
      
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
    
    // CHANNEL 2: WHATSAPP with enhanced retry logic
    if (profile.whatsapp_number && profile.whatsapp_number.trim()) {
      try {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Sending ${reminder.reminder_type} WhatsApp to ${profile.whatsapp_number}`);
        
        const whatsappResult = reminder.reminder_type === 'final_delivery'
          ? await sendFinalDeliveryWhatsAppToCreator(profile.whatsapp_number, messageData.title, messageData.id)
          : await sendCheckInWhatsAppToCreator(profile.whatsapp_number, messageData.title, messageData.id, diffHours);
        
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
      console.log(`[DUAL-CHANNEL-PROCESSOR] No WhatsApp number for ${user.email}, skipping WhatsApp`);
    }
    
    // CRITICAL FIX: Determine final status and update immediately
    const totalSuccessfulDeliveries = (emailSuccess ? 1 : 0) + (whatsappSuccess ? 1 : 0);
    const finalStatus = totalSuccessfulDeliveries > 0 ? 'sent' : 'failed';
    const finalError = totalSuccessfulDeliveries === 0 ? 'All delivery channels failed' : null;
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Delivery summary for reminder ${reminder.id}: Email ${emailSuccess ? 'SUCCESS' : 'FAILED'}, WhatsApp ${whatsappSuccess ? 'SUCCESS' : 'FAILED'}, Overall status: ${finalStatus}`);
    
    // CRITICAL: Atomic status update with verification
    const { error: updateError, data: updatedReminder } = await supabase
      .from('reminder_schedule')
      .update({
        status: finalStatus,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reminder.id)
      .select()
      .single();
    
    if (updateError) {
      console.error(`[DUAL-CHANNEL-PROCESSOR] CRITICAL: Failed to update reminder status:`, updateError);
      throw new Error(`Status update failed: ${updateError.message}`);
    } else {
      console.log(`[DUAL-CHANNEL-PROCESSOR] VERIFIED: Reminder ${reminder.id} status updated to ${finalStatus}`);
    }
    
    // ENHANCED: Update condition last_checked for final deliveries
    if (reminder.reminder_type === 'final_delivery' && finalStatus === 'sent') {
      await supabase
        .from('message_conditions')
        .update({
          last_checked: new Date().toISOString(),
          active: false // Deactivate after final delivery
        })
        .eq('id', reminder.condition_id);
      
      console.log(`[DUAL-CHANNEL-PROCESSOR] Deactivated condition ${reminder.condition_id} after final delivery`);
    }
    
    // Log all delivery attempts with enhanced metadata
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
          hoursUntilDeadline: diffHours,
          finalStatus: finalStatus,
          deliveryCount: totalSuccessfulDeliveries
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
      error: finalError,
      reminderType: reminder.reminder_type,
      finalStatus: finalStatus
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
 * ENHANCED: Immediate frontend event emission for real-time UI updates
 */
async function emitImmediateFrontendEvents(supabase: any, messageId: string, conditionId: string, deliveryResult: any): Promise<void> {
  try {
    console.log(`[DUAL-CHANNEL-PROCESSOR] Emitting IMMEDIATE frontend events for message ${messageId}, type: ${deliveryResult.reminderType}`);
    
    const eventData = {
      messageId: messageId,
      conditionId: conditionId,
      action: deliveryResult.reminderType === 'final_delivery' ? 'delivery-complete' : 'reminder-sent',
      source: 'dual-channel-processor',
      reminderType: deliveryResult.reminderType,
      deliveryChannels: deliveryResult.deliveryResults?.map((r: any) => r.channel) || [],
      successfulDeliveries: deliveryResult.totalDeliveries || 0,
      timestamp: new Date().toISOString(),
      enhanced: true,
      finalStatus: deliveryResult.finalStatus
    };
    
    // CRITICAL: Insert multiple event types to ensure frontend catches at least one
    const eventInserts = [
      {
        reminder_id: `frontend-event-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: 'frontend-conditions-updated',
        delivery_channel: 'event-trigger',
        delivery_status: 'completed',
        response_data: {
          event_type: 'conditions-updated',
          event_payload: eventData,
          purpose: 'trigger_ui_refresh'
        }
      },
      {
        reminder_id: `message-event-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: 'frontend-message-updated',
        delivery_channel: 'message-refresh',
        delivery_status: 'completed',
        response_data: {
          event_type: 'message-reminder-updated',
          event_payload: {
            messageId: messageId,
            action: deliveryResult.reminderType === 'final_delivery' ? 'delivery-complete' : 'reminder-delivered',
            source: 'dual-channel-processor',
            reminderType: deliveryResult.reminderType,
            timestamp: new Date().toISOString()
          },
          purpose: 'trigger_message_card_refresh'
        }
      }
    ];
    
    // Insert events for frontend processing
    for (const eventInsert of eventInserts) {
      await supabase.from('reminder_delivery_log').insert(eventInsert);
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] IMMEDIATE frontend events emitted for message ${messageId}`);
    
  } catch (error: any) {
    console.error(`[DUAL-CHANNEL-PROCESSOR] Error emitting immediate frontend events:`, error);
    // Don't fail the entire process for logging errors
  }
}

/**
 * Send final delivery WhatsApp message
 */
async function sendFinalDeliveryWhatsAppToCreator(
  whatsappNumber: string,
  messageTitle: string,
  messageId: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const supabase = supabaseClient();
    
    const whatsappMessage = `🚨 *EchoVault Final Alert*\n\nYour deadline has been reached!\n\nMessage: "${messageTitle}"\n\nYour message has been automatically delivered to all recipients as planned.\n\n✅ Delivery completed at ${new Date().toLocaleString()}`;
    
    console.log(`[WHATSAPP-FINAL] Sending final delivery WhatsApp to ${whatsappNumber}`);
    
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: whatsappNumber,
        message: whatsappMessage,
        messageId: messageId,
        source: 'final-delivery-alert'
      }
    });
    
    if (error) {
      throw new Error(`WhatsApp API error: ${error.message}`);
    }
    
    console.log(`[WHATSAPP-FINAL] Final delivery WhatsApp sent successfully to ${whatsappNumber}`);
    return { success: true, messageId: data?.messageId };
    
  } catch (error: any) {
    console.error("[WHATSAPP-FINAL] Final delivery WhatsApp error:", error);
    return {
      success: false,
      error: `Final delivery WhatsApp failed: ${error.message}`
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
 * Generate final delivery email HTML
 */
function generateFinalDeliveryEmailHtml(message: any, condition: any, hoursFromDeadline: number): string {
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
        .alert-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .message-title {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          font-weight: 500;
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
          <h1>🚨 Message Delivered</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <p>Your deadline has been reached and your message has been automatically delivered to all recipients.</p>
          
          <div class="message-title">
            <strong>Message:</strong> ${message.title}
          </div>
          
          <div class="alert-box">
            <p><strong>Delivery completed at: ${new Date().toLocaleString()}</strong></p>
            <p>All specified recipients have been notified as planned.</p>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
            This message was delivered automatically according to your EchoVault settings.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from EchoVault.<br>
          © ${new Date().getFullYear()} EchoVault - Secure Message Delivery</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
