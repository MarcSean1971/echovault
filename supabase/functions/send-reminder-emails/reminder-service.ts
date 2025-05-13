
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
    active: boolean;
    condition_type: string;
    recipients: Recipient[];
    trigger_date?: string;
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
    // Remove the blocking check for trigger_date since we now handle null dates in the getMessagesNeedingReminders function
    // Instead, log a warning but continue with the reminder
    if (!condition.trigger_date) {
      console.log(`No trigger_date set for condition ${condition.id}, but proceeding with test reminder`);
    }
    
    // Get sender name
    let senderName = "Unknown Sender";
    let senderEmail = "";
    let senderPhone = "";
    try {
      const supabase = supabaseClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, backup_email, whatsapp_number')
        .eq('id', message.user_id)
        .single();
      
      if (!error && profile) {
        senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        if (!senderName) senderName = "EchoVault User";
        senderEmail = profile.backup_email || ""; // Get sender email for check-in reminders
        senderPhone = profile.whatsapp_number || ""; // Get sender phone for check-in reminders
      }
    } catch (error) {
      console.error("Error fetching sender info:", error);
    }
    
    if (debug) {
      console.log(`Sending reminders for message "${message.title}" from ${senderName}`);
      console.log(`Message user_id: ${message.user_id}`);
      console.log(`Deadline in ${condition.trigger_date ? hoursUntilDeadline.toFixed(1) : 'N/A'} hours`);
    }
    
    const reminderResults: ReminderResult[] = [];
    
    // Check if this is a check-in related condition
    // These condition types should only send reminders to the message creator
    const isCheckInCondition = ['recurring_check_in', 'no_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    
    if (debug) {
      console.log(`Condition type: ${condition.condition_type}`);
      console.log(`Is check-in condition: ${isCheckInCondition}`);
    }
    
    if (isCheckInCondition) {
      // For check-in conditions, only send reminder to the message creator
      if (debug) {
        console.log(`This is a check-in condition, only sending reminder to creator (${senderEmail})`);
      }
      
      // Only proceed if we have the sender's email
      if (!senderEmail) {
        console.warn(`No email found for message creator (user_id: ${message.user_id}), cannot send check-in reminder`);
        return { 
          success: false, 
          results: [{
            success: false,
            error: "No email found for message creator"
          }]
        };
      }
      
      // Send email reminder to creator
      try {
        const emailResult = await sendEmailReminder(
          message.id,
          senderEmail,
          senderName,
          senderName, // The sender name is the same as recipient name in this case
          message.title,
          hoursUntilDeadline,
          condition.trigger_date || new Date().toISOString(),
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
      
      // Send WhatsApp reminder to creator if phone is available
      if (senderPhone) {
        try {
          const whatsappMessage = `🔔 CHECK-IN REMINDER: Your message "${message.title}" requires a check-in within about ${Math.round(hoursUntilDeadline)} hours to prevent delivery.`;
          
          const whatsappResult = await sendWhatsAppReminder(
            {
              id: 'creator',
              name: senderName,
              email: senderEmail,
              phone: senderPhone
            },
            {
              id: message.id,
              title: message.title,
              deadline: condition.trigger_date || new Date().toISOString(),
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
    } else {
      // For non-check-in conditions (e.g., panic_trigger), send reminders to the recipients as before
      if (!condition.recipients || !Array.isArray(condition.recipients) || condition.recipients.length === 0) {
        console.error(`No recipients for message ${message.id}`);
        return { success: false, results: [] };
      }
      
      if (debug) {
        console.log(`This is NOT a check-in condition, sending reminders to ${condition.recipients.length} recipients`);
      }
      
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
            condition.trigger_date || new Date().toISOString(),
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
                deadline: condition.trigger_date || new Date().toISOString(),
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
    }
    
    // Record that reminders were sent
    try {
      // Get user_id from message
      if (!message.user_id) {
        console.warn(`No user_id in message ${message.id}, using string 'unknown'`);
      }
      
      // Pass user_id from message to recordReminderSent
      const recordResult = await recordReminderSent(
        message.id, 
        condition.id, 
        condition.trigger_date || new Date().toISOString(),
        message.user_id || 'unknown'
      );
      
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
