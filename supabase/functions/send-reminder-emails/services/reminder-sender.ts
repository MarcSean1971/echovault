
import { supabaseClient } from "../supabase-client.ts";
import { sendEmail } from "./email-service.ts";
import { formatReminderTime } from "../utils/format-utils.ts";

export interface ReminderResult {
  recipientId: string;
  recipientEmail: string;
  reminderType: string;
  success: boolean;
  error?: string;
  deliveryId?: string;
}

/**
 * Send a reminder to the message creator for check-in type conditions
 * FIXED: Use consistent methods to retrieve the creator's email address
 */
export async function sendCreatorReminder(
  messageId: string,
  conditionId: string,
  messageTitle: string,
  userId: string,
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false
): Promise<ReminderResult[]> {
  try {
    if (debug) console.log(`[REMINDER-SENDER] Sending creator reminder for message ${messageId} to user ${userId}`);
    
    const supabase = supabaseClient();
    const results: ReminderResult[] = [];
    
    // CRITICAL FIX: Get the creator's email using a consistent, reliable method
    // First try auth.users directly (this works for final alerts)
    let creatorEmail = null;
    let creatorName = "Message Creator";
    
    try {
      // Get user info from auth.users directly (same method used in final alerts)
      const { data: userData, error: userError } = await supabase.auth
        .admin.getUserById(userId);
      
      if (userError) throw userError;
      
      if (userData && userData.user && userData.user.email) {
        creatorEmail = userData.user.email;
        if (debug) console.log(`[REMINDER-SENDER] Found creator email from auth.users: ${creatorEmail}`);
      } else {
        throw new Error("No email found in user data");
      }
    } catch (adminApiError) {
      // Fallback method if admin API fails
      console.error("[REMINDER-SENDER] Error using admin.getUserById:", adminApiError);
      console.log("[REMINDER-SENDER] Trying fallback method to get creator email");
      
      try {
        // Fallback to querying auth.users directly (needs admin privileges)
        const { data: authUser, error: authError } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", userId)
          .single();
          
        if (authError) throw authError;
        
        if (authUser && authUser.email) {
          creatorEmail = authUser.email;
          if (debug) console.log(`[REMINDER-SENDER] Found creator email from auth.users table: ${creatorEmail}`);
        } else {
          throw new Error("No email found in auth.users query");
        }
      } catch (authQueryError) {
        console.error("[REMINDER-SENDER] Error querying auth.users:", authQueryError);
        
        // Last-resort fallback: try to get from profiles if available
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("backup_email")
            .eq("id", userId)
            .single();
            
          if (profileError) throw profileError;
          
          // If profile has a backup email, use that
          if (profile && profile.backup_email) {
            creatorEmail = profile.backup_email;
            console.log(`[REMINDER-SENDER] Using backup email as fallback: ${creatorEmail}`);
          } else {
            throw new Error("No backup email found in profile");
          }
        } catch (profileError) {
          console.error("[REMINDER-SENDER] Error getting profile:", profileError);
          throw new Error("Failed to get any email for creator");
        }
      }
    }
    
    // Verify we have an email to send to
    if (!creatorEmail) {
      console.error(`[REMINDER-SENDER] No email found for user ${userId}`);
      return [{
        recipientId: userId,
        recipientEmail: "unknown",
        reminderType: "creator_check_in",
        success: false,
        error: "No email address found for creator"
      }];
    }
    
    // Get creator name for personalization
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();
        
      if (profileData) {
        creatorName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || "Message Creator";
      }
    } catch (nameError) {
      console.warn("[REMINDER-SENDER] Error getting creator name:", nameError);
      // Non-fatal error, continue with default name
    }
    
    // Format time until deadline for the email
    const timeUntilDeadline = formatReminderTime(hoursUntilDeadline);
    
    // Track the reminder attempt before sending
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `check-in-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: creatorEmail,
        delivery_channel: 'email',
        channel_order: 1,
        delivery_status: 'processing',
        response_data: { 
          type: "creator_check_in", 
          hoursUntilDeadline, 
          scheduledAt: scheduledAt 
        }
      });
    } catch (logError) {
      console.warn("[REMINDER-SENDER] Error creating delivery log:", logError);
      // Non-fatal error, continue sending
    }
    
    // Construct the email
    const subject = `ACTION REQUIRED: Check-in for "${messageTitle}"`;
    const html = `
      <h2>Check-in Required</h2>
      <p>Hello ${creatorName},</p>
      <p>This is a reminder to check in for your message: <strong>${messageTitle}</strong>.</p>
      <p>If you do not check in within <strong>${timeUntilDeadline}</strong>, your message will be automatically delivered.</p>
      <p>Please log in to your account and check in as soon as possible.</p>
      <p>Thank you,<br>EchoVault</p>
    `;
    
    // Send the email
    try {
      const emailResult = await sendEmail({
        to: creatorEmail,
        subject,
        html,
        from: "EchoVault <notifications@echo-vault.app>"
      });
      
      console.log(`[REMINDER-SENDER] Creator reminder email sent to ${creatorEmail}: ${emailResult}`);
      
      // Track the email delivery result
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `check-in-result-${Date.now()}`,
          message_id: messageId,
          condition_id: conditionId,
          recipient: creatorEmail,
          delivery_channel: 'email',
          channel_order: 2,
          delivery_status: emailResult ? 'delivered' : 'failed',
          response_data: { 
            type: "creator_check_in_result", 
            success: emailResult,
            time: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn("[REMINDER-SENDER] Error creating delivery result log:", logError);
      }
      
      results.push({
        recipientId: userId,
        recipientEmail: creatorEmail,
        reminderType: "creator_check_in",
        success: emailResult,
        deliveryId: `check-in-${Date.now()}`
      });
      
    } catch (emailError: any) {
      console.error("[REMINDER-SENDER] Error sending creator reminder:", emailError);
      
      results.push({
        recipientId: userId,
        recipientEmail: creatorEmail,
        reminderType: "creator_check_in",
        success: false,
        error: emailError.message || "Unknown error sending email"
      });
      
      // Track the failure
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `check-in-error-${Date.now()}`,
          message_id: messageId,
          condition_id: conditionId,
          recipient: creatorEmail,
          delivery_channel: 'email',
          channel_order: 3,
          delivery_status: 'failed',
          error_message: emailError.message || "Unknown error sending email",
          response_data: { 
            type: "creator_check_in_error",
            error: emailError.message || "Unknown error",
            time: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn("[REMINDER-SENDER] Error creating error log:", logError);
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("[REMINDER-SENDER] Error in sendCreatorReminder:", error);
    
    return [{
      recipientId: userId,
      recipientEmail: "error",
      reminderType: "creator_check_in",
      success: false,
      error: error.message || "Unknown error in sendCreatorReminder"
    }];
  }
}

/**
 * Send reminders to recipients for standard reminders
 */
export async function sendRecipientReminders(
  messageId: string,
  messageTitle: string,
  creatorName: string,
  recipients: any[],
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false,
  isFinalDelivery: boolean = false
): Promise<ReminderResult[]> {
  try {
    if (debug) {
      console.log(`[REMINDER-SENDER] Sending ${isFinalDelivery ? 'FINAL DELIVERY' : 'reminder'} for message ${messageId}`);
      console.log(`[REMINDER-SENDER] Recipients count: ${recipients.length}`);
    }
    
    const supabase = supabaseClient();
    const results: ReminderResult[] = [];
    
    // Format time until deadline for the email
    const timeUntilDeadline = formatReminderTime(hoursUntilDeadline);
    
    // Process each recipient
    for (const recipient of recipients) {
      const recipientEmail = recipient.email;
      const recipientName = recipient.name || "Recipient";
      
      if (!recipientEmail) {
        console.error(`[REMINDER-SENDER] No email for recipient ${recipient.id || 'unknown'}`);
        results.push({
          recipientId: recipient.id || "unknown",
          recipientEmail: "missing",
          reminderType: isFinalDelivery ? "final_delivery" : "standard",
          success: false,
          error: "No email address provided"
        });
        continue;
      }
      
      // Track the reminder attempt
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `recipient-${Date.now()}-${results.length}`,
          message_id: messageId,
          condition_id: recipient.id || "unknown",
          recipient: recipientEmail,
          delivery_channel: 'email',
          channel_order: 1,
          delivery_status: 'processing',
          response_data: { 
            type: isFinalDelivery ? "final_delivery" : "reminder", 
            hoursUntilDeadline,
            scheduledAt
          }
        });
      } catch (logError) {
        console.warn("[REMINDER-SENDER] Error creating recipient delivery log:", logError);
        // Non-fatal, continue sending
      }
      
      // Construct the email content
      let subject, html;
      
      if (isFinalDelivery) {
        subject = `Message Delivered: "${messageTitle}" from ${creatorName}`;
        html = `
          <h2>Message Delivered</h2>
          <p>Hello ${recipientName},</p>
          <p>${creatorName} has sent you a message titled: <strong>${messageTitle}</strong>.</p>
          <p>This message was automatically delivered because the sender did not check in within the specified timeframe.</p>
          <p>Please log in to your account to view the complete message.</p>
          <p>Thank you,<br>EchoVault</p>
        `;
      } else {
        subject = `Upcoming Message: "${messageTitle}" from ${creatorName}`;
        html = `
          <h2>Upcoming Message Notification</h2>
          <p>Hello ${recipientName},</p>
          <p>This is a reminder that ${creatorName} has a message titled <strong>${messageTitle}</strong> that will be delivered to you in ${timeUntilDeadline}.</p>
          <p>The message will be delivered if the sender does not check in within that timeframe.</p>
          <p>Thank you,<br>EchoVault</p>
        `;
      }
      
      // Send the email
      try {
        const emailResult = await sendEmail({
          to: recipientEmail,
          subject,
          html,
          from: "EchoVault <notifications@echo-vault.app>"
        });
        
        if (debug) {
          console.log(`[REMINDER-SENDER] Email sent to ${recipientEmail}: ${emailResult}`);
        }
        
        // Track the delivery result
        try {
          await supabase.from('reminder_delivery_log').insert({
            reminder_id: `recipient-result-${Date.now()}-${results.length}`,
            message_id: messageId,
            condition_id: recipient.id || "unknown",
            recipient: recipientEmail,
            delivery_channel: 'email',
            channel_order: 2,
            delivery_status: emailResult ? 'delivered' : 'failed',
            response_data: { 
              type: isFinalDelivery ? "final_delivery_result" : "reminder_result", 
              success: emailResult
            }
          });
        } catch (logError) {
          console.warn("[REMINDER-SENDER] Error creating recipient result log:", logError);
        }
        
        results.push({
          recipientId: recipient.id || "unknown",
          recipientEmail,
          reminderType: isFinalDelivery ? "final_delivery" : "standard",
          success: emailResult,
          deliveryId: `recipient-${Date.now()}-${results.length}`
        });
        
      } catch (emailError: any) {
        console.error(`[REMINDER-SENDER] Error sending email to ${recipientEmail}:`, emailError);
        
        results.push({
          recipientId: recipient.id || "unknown",
          recipientEmail,
          reminderType: isFinalDelivery ? "final_delivery" : "standard",
          success: false,
          error: emailError.message || "Unknown error sending email"
        });
        
        // Track the failure
        try {
          await supabase.from('reminder_delivery_log').insert({
            reminder_id: `recipient-error-${Date.now()}-${results.length}`,
            message_id: messageId,
            condition_id: recipient.id || "unknown",
            recipient: recipientEmail,
            delivery_channel: 'email',
            channel_order: 3,
            delivery_status: 'failed',
            error_message: emailError.message || "Unknown error",
            response_data: { 
              type: isFinalDelivery ? "final_delivery_error" : "reminder_error", 
              error: emailError.message
            }
          });
        } catch (logError) {
          console.warn("[REMINDER-SENDER] Error creating recipient error log:", logError);
        }
      }
    }
    
    return results;
  } catch (error: any) {
    console.error("[REMINDER-SENDER] Error in sendRecipientReminders:", error);
    
    return [{
      recipientId: "error",
      recipientEmail: "error",
      reminderType: isFinalDelivery ? "final_delivery" : "standard",
      success: false,
      error: error.message || "Unknown error in sendRecipientReminders"
    }];
  }
}
