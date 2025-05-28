import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { sendCheckInWhatsAppToCreator } from "./whatsapp-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * SIMPLIFIED: Direct email delivery without complex routing
 */
export async function processDualChannelReminders(
  messageId?: string,
  debug: boolean = false,
  forceSend: boolean = false
): Promise<{ processedCount: number; successCount: number; failedCount: number; errors: string[] }> {
  try {
    const supabase = supabaseClient();
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] SIMPLIFIED processing for message: ${messageId || 'all'}`);
    
    // Clean up stuck reminders first
    await supabase
      .from('reminder_schedule')
      .update({ status: 'failed' })
      .eq('status', 'processing')
      .lt('scheduled_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
    
    // Build query for due reminders
    let query = supabase
      .from('reminder_schedule')
      .select(`
        id,
        message_id,
        condition_id,
        scheduled_at,
        reminder_type,
        delivery_priority,
        retry_count,
        messages (
          id,
          title,
          user_id,
          text_content,
          content,
          share_location,
          location_latitude,
          location_longitude,
          location_name,
          attachments
        ),
        message_conditions (
          id,
          condition_type,
          recipients,
          active,
          last_checked,
          hours_threshold,
          minutes_threshold
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });
    
    if (messageId) {
      query = query.eq('message_id', messageId);
    }
    
    const { data: dueReminders, error } = await query;
    
    if (error) {
      console.error("[DUAL-CHANNEL-PROCESSOR] Error fetching due reminders:", error);
      return { processedCount: 0, successCount: 0, failedCount: 1, errors: [error.message] };
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Found ${dueReminders?.length || 0} due reminders`);
    
    if (!dueReminders || dueReminders.length === 0) {
      console.log("[DUAL-CHANNEL-PROCESSOR] No due reminders found");
      return { processedCount: 0, successCount: 0, failedCount: 0, errors: [] };
    }
    
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    // Process each due reminder with SIMPLIFIED handlers
    for (const reminder of dueReminders) {
      try {
        processedCount++;
        
        // Mark reminder as processing
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            retry_count: (reminder.retry_count || 0) + 1
          })
          .eq('id', reminder.id);
        
        const message = reminder.messages;
        const condition = reminder.message_conditions;
        
        if (!message || !condition) {
          console.error(`[DUAL-CHANNEL-PROCESSOR] Missing message or condition for reminder ${reminder.id}`);
          await supabase
            .from('reminder_schedule')
            .update({ status: 'failed' })
            .eq('id', reminder.id);
          failedCount++;
          continue;
        }
        
        console.log(`[DUAL-CHANNEL-PROCESSOR] Processing ${reminder.reminder_type} for message "${message.title}"`);
        
        let success = false;
        
        // SIMPLIFIED: Direct processing based on reminder type
        if (reminder.reminder_type === 'reminder') {
          console.log(`[DUAL-CHANNEL-PROCESSOR] CHECK-IN REMINDER - sending to CREATOR`);
          success = await processCreatorReminder(reminder, message, condition, debug);
          
        } else if (reminder.reminder_type === 'final_notice') {
          console.log(`[DUAL-CHANNEL-PROCESSOR] FINAL NOTICE - sending to CREATOR`);
          success = await processFinalNotice(reminder, message, condition, debug);
          
        } else if (reminder.reminder_type === 'final_delivery') {
          console.log(`[DUAL-CHANNEL-PROCESSOR] FINAL DELIVERY - DIRECT EMAIL TO RECIPIENTS`);
          success = await processDirectFinalDelivery(reminder, message, condition, debug);
        }
        
        if (success) {
          successCount++;
          console.log(`[DUAL-CHANNEL-PROCESSOR] Successfully processed reminder ${reminder.id}`);
        } else {
          failedCount++;
          console.error(`[DUAL-CHANNEL-PROCESSOR] Failed to process reminder ${reminder.id}`);
        }
        
      } catch (error: any) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] Exception processing reminder ${reminder.id}:`, error);
        failedCount++;
        
        await supabase
          .from('reminder_schedule')
          .update({ status: 'failed' })
          .eq('id', reminder.id);
        
        errors.push(`Reminder ${reminder.id}: ${error.message}`);
      }
    }
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Processing complete: ${successCount} successful, ${failedCount} failed out of ${processedCount} total`);
    
    return {
      processedCount,
      successCount,
      failedCount,
      errors
    };
    
  } catch (error: any) {
    console.error("[DUAL-CHANNEL-PROCESSOR] Critical error:", error);
    return {
      processedCount: 0,
      successCount: 0,
      failedCount: 1,
      errors: [error.message]
    };
  }
}

/**
 * Process check-in reminder - send to creator via email/WhatsApp
 */
async function processCreatorReminder(reminder: any, message: any, condition: any, debug: boolean): Promise<boolean> {
  const supabase = supabaseClient();
  
  try {
    // Get creator's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_number, email, first_name, last_name')
      .eq('id', message.user_id)
      .single();
    
    if (!profile) {
      console.error(`[DUAL-CHANNEL-PROCESSOR] No profile found for creator ${message.user_id}`);
      return false;
    }
    
    // Calculate hours until deadline
    const now = new Date();
    const lastChecked = new Date(condition.last_checked);
    const hoursThreshold = condition.hours_threshold || 0;
    const minutesThreshold = condition.minutes_threshold || 0;
    
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + hoursThreshold);
    deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
    
    const hoursUntilDeadline = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    // Send email reminder to creator
    const emailResult = await sendCheckInEmailToCreator(
      profile.email,
      message.title,
      message.id,
      hoursUntilDeadline,
      profile.first_name || 'User'
    );
    
    let whatsappResult = { success: true };
    
    // Send WhatsApp reminder to creator if available
    if (profile.whatsapp_number) {
      whatsappResult = await sendCheckInWhatsAppToCreator(
        profile.whatsapp_number,
        message.title,
        message.id,
        hoursUntilDeadline
      );
    }
    
    if (emailResult.success || whatsappResult.success) {
      await supabase
        .from('reminder_schedule')
        .update({ 
          status: 'completed',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      await reminderLogger.logDelivery(
        reminder.id,
        message.id,
        condition.id,
        profile.email,
        'check_in_reminder',
        1,
        'completed',
        {
          email_success: emailResult.success,
          whatsapp_success: whatsappResult.success,
          hours_until_deadline: hoursUntilDeadline
        }
      );
      
      console.log(`[DUAL-CHANNEL-PROCESSOR] Check-in reminder sent to creator successfully`);
      return true;
    } else {
      throw new Error(`Both email and WhatsApp delivery failed for creator`);
    }
    
  } catch (error) {
    console.error(`[DUAL-CHANNEL-PROCESSOR] Check-in reminder failed:`, error);
    return false;
  }
}

/**
 * Process final notice - send to creator via email/WhatsApp
 */
async function processFinalNotice(reminder: any, message: any, condition: any, debug: boolean): Promise<boolean> {
  const supabase = supabaseClient();
  
  try {
    // Get creator's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_number, email, first_name, last_name')
      .eq('id', message.user_id)
      .single();
    
    if (!profile) {
      console.error(`[DUAL-CHANNEL-PROCESSOR] No profile found for creator ${message.user_id}`);
      return false;
    }
    
    // Send final notice email to creator (different from check-in reminder)
    const emailResult = await sendFinalNoticeToCreator(
      profile.email,
      message.title,
      message.id,
      profile.first_name || 'User'
    );
    
    let whatsappResult = { success: true };
    
    // Send WhatsApp final notice to creator if available
    if (profile.whatsapp_number) {
      whatsappResult = await sendFinalNoticeWhatsApp(
        profile.whatsapp_number,
        message.title,
        message.id
      );
    }
    
    if (emailResult.success || whatsappResult.success) {
      await supabase
        .from('reminder_schedule')
        .update({ 
          status: 'completed',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      await reminderLogger.logDelivery(
        reminder.id,
        message.id,
        condition.id,
        profile.email,
        'final_notice',
        1,
        'completed',
        {
          email_success: emailResult.success,
          whatsapp_success: whatsappResult.success
        }
      );
      
      console.log(`[DUAL-CHANNEL-PROCESSOR] Final notice sent to creator successfully`);
      return true;
    } else {
      throw new Error(`Both email and WhatsApp delivery failed for final notice`);
    }
    
  } catch (error) {
    console.error(`[DUAL-CHANNEL-PROCESSOR] Final notice failed:`, error);
    return false;
  }
}

/**
 * SIMPLIFIED: Direct email delivery to recipients - NO COMPLEX ROUTING
 */
async function processDirectFinalDelivery(reminder: any, message: any, condition: any, debug: boolean): Promise<boolean> {
  const supabase = supabaseClient();
  
  try {
    console.log(`[DUAL-CHANNEL-PROCESSOR] DIRECT FINAL DELIVERY - sending emails to recipients`);
    
    if (!condition.recipients || condition.recipients.length === 0) {
      console.log(`[DUAL-CHANNEL-PROCESSOR] No recipients for message ${message.id}`);
      return true; // Not a failure, just no recipients
    }
    
    // Get sender details
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', message.user_id)
      .single();
    
    const senderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'A user' : 'A user';
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Sending to ${condition.recipients.length} recipients from ${senderName}`);
    
    // DIRECT EMAIL SENDING - No routing, no complex logic
    let successCount = 0;
    
    for (const recipient of condition.recipients) {
      try {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Sending email directly to ${recipient.email}`);
        
        // Create delivery record
        const deliveryId = crypto.randomUUID();
        await supabase
          .from('delivered_messages')
          .insert({
            message_id: message.id,
            condition_id: condition.id,
            recipient_id: recipient.id,
            delivery_id: deliveryId,
            delivered_at: new Date().toISOString()
          });
        
        // DIRECT RESEND EMAIL CALL - No routing through other functions
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
          throw new Error("Missing RESEND_API_KEY");
        }
        
        const emailPayload = {
          from: "EchoVault <notifications@echo-vault.app>",
          to: [recipient.email],
          subject: `${senderName} sent you a secure message: "${message.title}"`,
          html: `
            <h1>Secure Message from ${senderName}</h1>
            <h2>${message.title}</h2>
            <p>${senderName} has sent you a secure message through EchoVault.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              <h3>Message Content:</h3>
              <p>${message.text_content || message.content || 'No text content available'}</p>
            </div>
            <p>This message was automatically delivered by EchoVault's secure messaging system.</p>
          `
        };
        
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });
        
        if (response.ok) {
          console.log(`[DUAL-CHANNEL-PROCESSOR] Email sent successfully to ${recipient.email}`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.error(`[DUAL-CHANNEL-PROCESSOR] Email failed to ${recipient.email}:`, errorText);
        }
        
      } catch (emailError) {
        console.error(`[DUAL-CHANNEL-PROCESSOR] Email error for ${recipient.email}:`, emailError);
      }
    }
    
    // Mark reminder as completed
    await supabase
      .from('reminder_schedule')
      .update({ 
        status: 'completed',
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', reminder.id);
    
    // Deactivate condition
    await supabase
      .from('message_conditions')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', condition.id);
    
    // Log success
    await reminderLogger.logDelivery(
      reminder.id,
      message.id,
      condition.id,
      'recipients',
      'final_delivery',
      1,
      'completed',
      {
        recipients_emailed: successCount,
        total_recipients: condition.recipients.length,
        processed_at: new Date().toISOString()
      }
    );
    
    console.log(`[DUAL-CHANNEL-PROCESSOR] Direct delivery complete: ${successCount}/${condition.recipients.length} emails sent`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error(`[DUAL-CHANNEL-PROCESSOR] Direct delivery failed:`, error);
    return false;
  }
}

/**
 * Send final notice email to creator (different from check-in reminder)
 */
async function sendFinalNoticeToCreator(
  email: string,
  messageTitle: string,
  messageId: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendCheckInEmailToCreator(
      email,
      messageTitle,
      messageId,
      0.25, // 15 minutes = 0.25 hours
      firstName,
      true // flag to indicate this is a final notice
    );
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send final notice WhatsApp to creator
 */
async function sendFinalNoticeWhatsApp(
  whatsappNumber: string,
  messageTitle: string,
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendCheckInWhatsAppToCreator(
      whatsappNumber,
      messageTitle,
      messageId,
      0.25, // 15 minutes = 0.25 hours
      true // flag to indicate this is a final notice
    );
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate missing reminder schedules for armed conditions
 */
export async function generateMissingReminders(debug: boolean = false): Promise<number> {
  try {
    const supabase = supabaseClient();
    
    // Find armed conditions without pending reminders
    const { data: armedConditions } = await supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        condition_type,
        last_checked,
        hours_threshold,
        minutes_threshold,
        reminder_hours
      `)
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date']);
    
    if (!armedConditions) return 0;
    
    let generatedCount = 0;
    
    for (const condition of armedConditions) {
      // Check if this condition already has pending reminders
      const { data: existingReminders } = await supabase
        .from('reminder_schedule')
        .select('id')
        .eq('condition_id', condition.id)
        .eq('status', 'pending')
        .limit(1);
      
      if (existingReminders && existingReminders.length > 0) {
        continue; // Skip if reminders already exist
      }
      
      // Generate new reminder schedule with 3 types
      if (debug) {
        console.log(`[DUAL-CHANNEL-PROCESSOR] Generating 3-type reminders for condition ${condition.id}`);
      }
      
      // Calculate deadline
      const lastChecked = new Date(condition.last_checked);
      const deadline = new Date(lastChecked);
      deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
      deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
      
      // Generate all 3 types of reminder entries
      const reminderHours = condition.reminder_hours || [24 * 60]; // Default to 24 hours
      const reminderEntries = [];
      
      // 1. Check-in reminders
      for (const minutes of reminderHours) {
        const scheduledAt = new Date(deadline.getTime() - (minutes * 60 * 1000));
        
        if (scheduledAt > new Date()) {
          reminderEntries.push({
            message_id: condition.message_id,
            condition_id: condition.id,
            scheduled_at: scheduledAt.toISOString(),
            reminder_type: 'reminder',
            status: 'pending',
            delivery_priority: minutes < 60 ? 'high' : 'normal'
          });
        }
      }
      
      // 2. Final notice (15 minutes before deadline)
      const finalNoticeTime = new Date(deadline.getTime() - (15 * 60 * 1000));
      if (finalNoticeTime > new Date()) {
        reminderEntries.push({
          message_id: condition.message_id,
          condition_id: condition.id,
          scheduled_at: finalNoticeTime.toISOString(),
          reminder_type: 'final_notice',
          status: 'pending',
          delivery_priority: 'high'
        });
      }
      
      // 3. Final delivery (at exact deadline)
      if (deadline > new Date()) {
        reminderEntries.push({
          message_id: condition.message_id,
          condition_id: condition.id,
          scheduled_at: deadline.toISOString(),
          reminder_type: 'final_delivery',
          status: 'pending',
          delivery_priority: 'critical'
        });
      }
      
      if (reminderEntries.length > 0) {
        await supabase
          .from('reminder_schedule')
          .insert(reminderEntries);
        
        generatedCount += reminderEntries.length;
      }
    }
    
    if (debug) {
      console.log(`[DUAL-CHANNEL-PROCESSOR] Generated ${generatedCount} missing reminders`);
    }
    
    return generatedCount;
  } catch (error) {
    console.error("[DUAL-CHANNEL-PROCESSOR] Error generating missing reminders:", error);
    return 0;
  }
}
