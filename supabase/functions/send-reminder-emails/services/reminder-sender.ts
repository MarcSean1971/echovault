
import { sendEmailReminder } from "./email-service.ts";
import { sendWhatsAppReminder } from "./whatsapp-service.ts";
import { recordReminderSent } from "../db/reminder-tracking.ts";
import { supabaseClient } from "../supabase-client.ts";

interface ReminderResult {
  success: boolean;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  method?: string;
  error?: string;
}

/**
 * Send creator reminders for check-in related conditions
 */
export async function sendCreatorReminder(
  messageId: string,
  conditionId: string,
  messageTitle: string,
  userId: string,
  hoursUntilDeadline: number,
  triggerDate: string,
  debug = false
): Promise<ReminderResult[]> {
  const reminderResults: ReminderResult[] = [];
  
  try {
    // Get sender/creator profile info
    const supabase = supabaseClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, backup_email, whatsapp_number')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      console.error("Error fetching creator profile:", error || "No profile found");
      return [{
        success: false,
        error: error?.message || "No profile found for message creator"
      }];
    }
    
    const senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "EchoVault User";
    const senderEmail = profile.backup_email;
    const senderPhone = profile.whatsapp_number;
    
    if (!senderEmail) {
      console.warn(`No email found for message creator (user_id: ${userId}), cannot send check-in reminder`);
      reminderResults.push({
        success: false,
        error: "No email found for message creator"
      });
    } else {
      // Send email reminder to creator
      try {
        const emailResult = await sendEmailReminder(
          messageId,
          senderEmail,
          senderName,
          senderName, // The sender name is the same as recipient name in this case
          messageTitle,
          hoursUntilDeadline,
          triggerDate,
          debug
        );
        
        reminderResults.push({
          success: emailResult.success,
          recipientEmail: senderEmail,
          method: "email",
          error: emailResult.error
        });
        
        if (debug) {
          console.log(`Creator email reminder ${emailResult.success ? "sent" : "failed"} to ${senderEmail}`);
          if (!emailResult.success) {
            console.error(`Creator email error: ${emailResult.error}`);
          }
        }
      } catch (error: any) {
        console.error(`Error sending email reminder to creator ${senderEmail}:`, error);
        reminderResults.push({
          success: false,
          recipientEmail: senderEmail,
          method: "email",
          error: error.message || "Unknown error"
        });
      }
    }
    
    // Send WhatsApp reminder to creator if phone is available
    if (senderPhone) {
      try {
        const whatsappResult = await sendWhatsAppReminder(
          {
            id: 'creator',
            name: senderName,
            email: senderEmail || "",
            phone: senderPhone
          },
          {
            id: messageId,
            title: messageTitle,
            deadline: triggerDate,
            hoursUntil: Math.round(hoursUntilDeadline)
          },
          senderName,
          debug
        );
        
        reminderResults.push({
          success: whatsappResult.success,
          recipientPhone: senderPhone,
          method: "whatsapp",
          error: whatsappResult.error
        });
        
        if (debug) {
          console.log(`Creator WhatsApp reminder ${whatsappResult.success ? "sent" : "failed"} to ${senderPhone}`);
          if (!whatsappResult.success) {
            console.error(`Creator WhatsApp error: ${whatsappResult.error}`);
          }
        }
      } catch (error: any) {
        console.error(`Error sending WhatsApp reminder to creator ${senderPhone}:`, error);
        reminderResults.push({
          success: false,
          recipientPhone: senderPhone,
          method: "whatsapp",
          error: error.message || "Unknown error"
        });
      }
    }
    
    return reminderResults;
  } catch (error: any) {
    console.error(`Error in sendCreatorReminder:`, error);
    return [{
      success: false,
      error: error.message || "Unknown error in sendCreatorReminder function"
    }];
  }
}

/**
 * Send reminders to recipients for non-check-in conditions
 */
export async function sendRecipientReminders(
  messageId: string,
  messageTitle: string,
  senderName: string,
  recipients: any[],
  hoursUntilDeadline: number,
  triggerDate: string,
  debug = false
): Promise<ReminderResult[]> {
  const reminderResults: ReminderResult[] = [];
  
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    console.warn(`No recipients for message ${messageId}`);
    return [{
      success: false,
      error: "No recipients provided"
    }];
  }
  
  if (debug) {
    console.log(`Sending reminders to ${recipients.length} recipients`);
  }
  
  // Send reminders to each recipient
  for (const recipient of recipients) {
    if (debug) {
      console.log(`Processing reminder for recipient ${recipient.name} (${recipient.email})`);
    }
    
    // Send email reminder
    try {
      const emailResult = await sendEmailReminder(
        messageId,
        recipient.email,
        recipient.name,
        senderName,
        messageTitle,
        hoursUntilDeadline,
        triggerDate,
        debug
      );
      
      reminderResults.push({
        success: emailResult.success,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        method: "email",
        error: emailResult.error
      });
      
      if (debug) {
        console.log(`Email reminder ${emailResult.success ? "sent" : "failed"} to ${recipient.email}`);
        if (!emailResult.success) {
          console.error(`Email error: ${emailResult.error}`);
        }
      }
    } catch (error: any) {
      console.error(`Error sending email reminder to ${recipient.email}:`, error);
      reminderResults.push({
        success: false,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        method: "email",
        error: error.message || "Unknown error"
      });
    }
    
    // Send WhatsApp reminder if phone is available
    if (recipient.phone) {
      try {
        const whatsappResult = await sendWhatsAppReminder(
          recipient,
          {
            id: messageId,
            title: messageTitle,
            deadline: triggerDate,
            hoursUntil: Math.round(hoursUntilDeadline)
          },
          senderName,
          debug
        );
        
        reminderResults.push({
          success: whatsappResult.success,
          recipientId: recipient.id,
          recipientPhone: recipient.phone,
          method: "whatsapp",
          error: whatsappResult.error
        });
        
        if (debug) {
          console.log(`WhatsApp reminder ${whatsappResult.success ? "sent" : "failed"} to ${recipient.phone}`);
          if (!whatsappResult.success) {
            console.error(`WhatsApp error: ${whatsappResult.error}`);
          }
        }
      } catch (error: any) {
        console.error(`Error sending WhatsApp reminder to ${recipient.phone}:`, error);
        reminderResults.push({
          success: false,
          recipientId: recipient.id,
          recipientPhone: recipient.phone,
          method: "whatsapp",
          error: error.message || "Unknown error"
        });
      }
    }
  }
  
  return reminderResults;
}
