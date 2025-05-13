
import { supabaseClient } from "../supabase-client.ts";
import { ReminderResult } from "../types/reminder-types.ts";
import { sendEmailReminder } from "./email-service.ts";
import { sendWhatsAppReminder } from "./whatsapp-service.ts";

/**
 * Send a reminder to the message creator for check-in conditions
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
  const results: ReminderResult[] = [];
  
  try {
    const supabase = supabaseClient();
    
    console.log(`Sending reminder to message creator (user_id: ${userId}) for message ${messageId}`);
    
    // Get user profile to get their email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, whatsapp_number')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error(`Error fetching creator profile for user ${userId}:`, profileError);
      results.push({
        success: false,
        error: `Failed to fetch profile: ${profileError.message}`
      });
      return results;
    }
    
    if (!profile) {
      console.error(`No profile found for user ${userId}`);
      results.push({
        success: false,
        error: "No profile found for user"
      });
      return results;
    }
    
    // Get user auth data to get their email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser || !authUser.user) {
      console.error(`Error fetching auth user ${userId}:`, authError);
      results.push({
        success: false,
        error: `Failed to fetch auth user: ${authError?.message || "User not found"}`
      });
      return results;
    }
    
    const email = authUser.user.email;
    const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
    
    if (!email) {
      console.error(`No email found for user ${userId}`);
      results.push({
        success: false,
        error: "No email found for user"
      });
      return results;
    }
    
    console.log(`Creator email: ${email}, name: ${name}`);
    
    // Calculate deadline in human-readable format
    let deadlineText = "";
    if (hoursUntilDeadline < 1) {
      const minutesLeft = Math.floor(hoursUntilDeadline * 60);
      deadlineText = `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
    } else {
      const hoursRounded = Math.floor(hoursUntilDeadline);
      deadlineText = `${hoursRounded} hour${hoursRounded !== 1 ? 's' : ''}`;
    }
    
    // Send email reminder
    try {
      console.log(`Sending email reminder to creator ${email} for message ${messageId}`);
      
      const emailResult = await sendEmailReminder({
        recipientEmail: email,
        recipientName: name,
        messageTitle,
        deadlineText,
        messageId,
        isCreatorReminder: true,
        triggerDate
      });
      
      if (debug) {
        console.log(`Email reminder result:`, emailResult);
      }
      
      results.push({
        success: emailResult.success,
        recipient: email,
        method: "email",
        error: emailResult.error
      });
      
      console.log(`${emailResult.success ? 'Successfully sent' : 'Failed to send'} email reminder to creator ${email}`);
    } catch (emailError: any) {
      console.error(`Error sending email reminder to creator ${email}:`, emailError);
      results.push({
        success: false,
        recipient: email,
        method: "email",
        error: emailError.message || "Unknown email error"
      });
    }
    
    // If WhatsApp number is available, send WhatsApp reminder too
    if (profile.whatsapp_number) {
      try {
        console.log(`Sending WhatsApp reminder to creator ${profile.whatsapp_number} for message ${messageId}`);
        
        const whatsappResult = await sendWhatsAppReminder({
          phone: profile.whatsapp_number,
          name,
          messageTitle,
          deadlineText,
          messageId,
          isCreatorReminder: true
        });
        
        if (debug) {
          console.log(`WhatsApp reminder result:`, whatsappResult);
        }
        
        results.push({
          success: whatsappResult.success,
          recipient: profile.whatsapp_number,
          method: "whatsapp",
          error: whatsappResult.error
        });
        
        console.log(`${whatsappResult.success ? 'Successfully sent' : 'Failed to send'} WhatsApp reminder to creator ${profile.whatsapp_number}`);
      } catch (whatsappError: any) {
        console.error(`Error sending WhatsApp reminder to creator ${profile.whatsapp_number}:`, whatsappError);
        results.push({
          success: false,
          recipient: profile.whatsapp_number,
          method: "whatsapp",
          error: whatsappError.message || "Unknown WhatsApp error"
        });
      }
    } else {
      console.log(`No WhatsApp number found for creator, skipping WhatsApp reminder`);
    }
    
    return results;
  } catch (error: any) {
    console.error(`Error sending creator reminder:`, error);
    results.push({
      success: false,
      error: error.message || "Unknown error in sendCreatorReminder"
    });
    return results;
  }
}

/**
 * Send reminders to message recipients
 */
export async function sendRecipientReminders(
  messageId: string,
  messageTitle: string,
  senderName: string,
  recipients: Array<{ id: string, name: string, email: string, phone?: string }>,
  hoursUntilDeadline: number,
  triggerDate: string,
  debug = false
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  
  // Calculate deadline in human-readable format
  let deadlineText = "";
  if (hoursUntilDeadline < 1) {
    const minutesLeft = Math.floor(hoursUntilDeadline * 60);
    deadlineText = `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
  } else {
    const hoursRounded = Math.floor(hoursUntilDeadline);
    deadlineText = `${hoursRounded} hour${hoursRounded !== 1 ? 's' : ''}`;
  }
  
  for (const recipient of recipients) {
    // Send email reminder
    if (recipient.email) {
      try {
        console.log(`Sending email reminder to recipient ${recipient.email} (${recipient.name}) for message ${messageId}`);
        
        const emailResult = await sendEmailReminder({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          messageTitle,
          senderName,
          deadlineText,
          messageId,
          isCreatorReminder: false,
          triggerDate
        });
        
        if (debug) {
          console.log(`Email reminder result for ${recipient.email}:`, emailResult);
        }
        
        results.push({
          success: emailResult.success,
          recipient: recipient.email,
          method: "email",
          error: emailResult.error
        });
        
        console.log(`${emailResult.success ? 'Successfully sent' : 'Failed to send'} email reminder to recipient ${recipient.email}`);
      } catch (emailError: any) {
        console.error(`Error sending email reminder to recipient ${recipient.email}:`, emailError);
        results.push({
          success: false,
          recipient: recipient.email,
          method: "email",
          error: emailError.message || "Unknown email error"
        });
      }
    }
    
    // If WhatsApp number is available, send WhatsApp reminder too
    if (recipient.phone) {
      try {
        console.log(`Sending WhatsApp reminder to recipient ${recipient.phone} (${recipient.name}) for message ${messageId}`);
        
        const whatsappResult = await sendWhatsAppReminder({
          phone: recipient.phone,
          name: recipient.name,
          messageTitle,
          senderName,
          deadlineText,
          messageId,
          isCreatorReminder: false
        });
        
        if (debug) {
          console.log(`WhatsApp reminder result for ${recipient.phone}:`, whatsappResult);
        }
        
        results.push({
          success: whatsappResult.success,
          recipient: recipient.phone,
          method: "whatsapp",
          error: whatsappResult.error
        });
        
        console.log(`${whatsappResult.success ? 'Successfully sent' : 'Failed to send'} WhatsApp reminder to recipient ${recipient.phone}`);
      } catch (whatsappError: any) {
        console.error(`Error sending WhatsApp reminder to recipient ${recipient.phone}:`, whatsappError);
        results.push({
          success: false,
          recipient: recipient.phone,
          method: "whatsapp",
          error: whatsappError.message || "Unknown WhatsApp error"
        });
      }
    }
  }
  
  return results;
}
