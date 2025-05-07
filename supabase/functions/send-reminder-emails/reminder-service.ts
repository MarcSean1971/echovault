
import { sendEmailReminder } from "./services/email-service.ts";
import { sendWhatsAppReminder } from "./services/whatsapp-service.ts";
import { recordReminderSent } from "./db-service.ts";
import { supabaseClient } from "./supabase-client.ts";

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface ReminderData {
  message: {
    id: string;
    title: string;
    content: string | null;
    user_id: string;
    message_type: string;
  };
  condition: {
    id: string;
    message_id: string;
    user_id: string;
    active: boolean;
    condition_type: string;
    recipients: Recipient[];
    deadline?: string;
    reminder_hours?: number[];
  };
  hoursUntilDeadline: number;
  reminderHours: number[];
}

interface ReminderResult {
  success: boolean;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  method?: string;
  error?: string;
}

/**
 * Send reminder for a message
 */
export async function sendReminder(data: ReminderData, debug = false): Promise<{ success: boolean; results: ReminderResult[] }> {
  const { message, condition, hoursUntilDeadline } = data;
  
  try {
    if (!condition.deadline) {
      console.error(`No deadline set for condition ${condition.id}`);
      return { success: false, results: [] };
    }
    
    if (!condition.recipients || !Array.isArray(condition.recipients) || condition.recipients.length === 0) {
      console.error(`No recipients for message ${message.id}`);
      return { success: false, results: [] };
    }
    
    // Get sender name
    let senderName = "Unknown Sender";
    try {
      const supabase = supabaseClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', message.user_id)
        .single();
      
      if (!error && profile) {
        senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        if (!senderName) senderName = "EchoVault User";
      }
    } catch (error) {
      console.error("Error fetching sender name:", error);
    }
    
    if (debug) {
      console.log(`Sending reminders for message "${message.title}" from ${senderName}`);
      console.log(`Deadline in ${hoursUntilDeadline.toFixed(1)} hours`);
      console.log(`Recipients: ${condition.recipients.length}`);
    }
    
    const reminderResults: ReminderResult[] = [];
    
    // Send reminders to each recipient
    for (const recipient of condition.recipients) {
      if (debug) {
        console.log(`Processing reminder for recipient ${recipient.name} (${recipient.email})`);
      }
      
      // Send email reminder
      try {
        const emailResult = await sendEmailReminder(
          message.id,
          recipient.email,
          recipient.name,
          senderName,
          message.title,
          hoursUntilDeadline,
          condition.deadline,
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
          const whatsappMessage = `🔔 REMINDER: "${message.title}" will be delivered in about ${Math.round(hoursUntilDeadline)} hours if not disarmed.`;
          
          const whatsappResult = await sendWhatsAppReminder(
            recipient,
            {
              id: message.id,
              title: message.title,
              deadline: condition.deadline,
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
    
    // Record that reminders were sent
    try {
      const recordResult = await recordReminderSent(message.id, condition.id, condition.deadline);
      if (!recordResult) {
        console.warn(`Failed to record reminder for message ${message.id}`);
      }
    } catch (error) {
      console.error(`Error recording reminder for message ${message.id}:`, error);
    }
    
    // Count successes
    const successfulReminders = reminderResults.filter(r => r.success).length;
    
    return {
      success: successfulReminders > 0,
      results: reminderResults
    };
  } catch (error: any) {
    console.error(`Error sending reminders for message ${message.id}:`, error);
    return {
      success: false,
      results: [{
        success: false,
        error: error.message || "Unknown error in sendReminder function"
      }]
    };
  }
}
