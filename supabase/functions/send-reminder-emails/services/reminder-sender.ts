
import { supabaseClient } from "../supabase-client.ts";
import { sendEmail } from "./email-service.ts";

export interface ReminderResult {
  success: boolean;
  recipient?: string;
  method?: string;
  error?: string;
}

/**
 * Send reminder to message creator
 */
export async function sendCreatorReminder(
  messageId: string,
  conditionId: string,
  messageTitle: string,
  userId: string,
  hoursUntilDeadline: number,
  deadlineDate: string,
  debug: boolean = false
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  
  try {
    if (debug) {
      console.log(`Sending reminder to creator (user_id: ${userId})`);
      console.log(`Message title: "${messageTitle}"`);
    }
    
    // Get creator's email from profiles
    const { data: profile, error: profileError } = await supabaseClient()
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (profileError || !profile) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return [{ 
        success: false, 
        method: 'email', 
        error: `Creator profile not found: ${profileError?.message || 'Unknown error'}`
      }];
    }
    
    // Get backup email if available
    const emailList = [];
    
    // Use backup_email if set, otherwise try to get email from auth.users
    if (profile.backup_email) {
      emailList.push(profile.backup_email);
    } else {
      try {
        // Try to get user email from auth
        const { data: user } = await supabaseClient().auth.admin.getUserById(userId);
        
        if (user?.email) {
          emailList.push(user.email);
        }
      } catch (authError) {
        console.warn("Error getting user email from auth:", authError);
      }
    }
    
    if (emailList.length === 0) {
      console.error(`No email found for creator ${userId}`);
      return [{ success: false, method: 'email', error: 'No email address found for creator' }];
    }
    
    // Calculate hours and minutes for display
    const hours = Math.floor(hoursUntilDeadline);
    const minutes = Math.floor((hoursUntilDeadline % 1) * 60);
    
    // Format time remaining
    const timeRemaining = hours > 0 
      ? `${hours} hours, ${minutes} minutes`
      : `${minutes} minutes`;
    
    // Send email to creator
    for (const email of emailList) {
      try {
        if (debug) {
          console.log(`Sending email to creator at ${email}`);
        }
        
        await sendEmail({
          to: email,
          subject: `Reminder: "${messageTitle}" - Check-in Required`,
          html: `
            <h2>Message Check-in Reminder</h2>
            <p>This is a reminder about your message: <strong>${messageTitle}</strong></p>
            <p>Please check in to postpone message delivery.</p>
            <p><a href="https://echvault.lovable.ai/check-in" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px;">Check In Now</a></p>
          `
        });
        
        results.push({ success: true, recipient: email, method: 'email' });
      } catch (emailError: any) {
        console.error(`Error sending email to creator (${email}):`, emailError);
        results.push({ 
          success: false, 
          recipient: email, 
          method: 'email',
          error: emailError.message || 'Email sending failed'
        });
      }
    }
    
    // Also try WhatsApp if available
    if (profile.whatsapp_number) {
      try {
        // This is a placeholder - in production, you'd implement the WhatsApp sending logic
        console.log(`Would send WhatsApp reminder to creator at ${profile.whatsapp_number}`);
        
        // Simulate success
        results.push({ success: true, recipient: profile.whatsapp_number, method: 'whatsapp' });
      } catch (whatsappError: any) {
        console.error(`Error sending WhatsApp to creator:`, whatsappError);
        results.push({ 
          success: false, 
          recipient: profile.whatsapp_number, 
          method: 'whatsapp',
          error: whatsappError.message || 'WhatsApp sending failed'
        });
      }
    }
    
    return results;
  } catch (error: any) {
    console.error(`Error in sendCreatorReminder:`, error);
    return [{ 
      success: false, 
      error: error.message || 'Unknown error in sendCreatorReminder'
    }];
  }
}

/**
 * Send reminders to message recipients
 */
export async function sendRecipientReminders(
  messageId: string,
  messageTitle: string,
  senderName: string,
  recipients: any[],
  hoursUntilDeadline: number,
  deadlineDate: string,
  debug: boolean = false
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  
  if (!recipients || recipients.length === 0) {
    if (debug) {
      console.log(`No recipients found for message ${messageId}, skipping recipient notifications`);
    }
    return [];
  }
  
  // Calculate hours and minutes for display
  const hours = Math.floor(hoursUntilDeadline);
  const minutes = Math.floor((hoursUntilDeadline % 1) * 60);
  
  // Format time remaining
  const timeRemaining = hours > 0 
    ? `${hours} hours, ${minutes} minutes`
    : `${minutes} minutes`;
    
  if (debug) {
    console.log(`Sending reminders to ${recipients.length} recipients for message ${messageId}`);
    console.log(`Message title: "${messageTitle}" from ${senderName}`);
  }
  
  // Process each recipient
  for (const recipient of recipients) {
    try {
      if (!recipient.email) {
        console.warn(`No email found for recipient ${recipient.name || recipient.id}`);
        results.push({ 
          success: false, 
          recipient: recipient.name || recipient.id, 
          method: 'email',
          error: 'No email address found'
        });
        continue;
      }
      
      if (debug) {
        console.log(`Sending email to recipient ${recipient.name} at ${recipient.email}`);
      }
      
      // Send email to recipient
      await sendEmail({
        to: recipient.email,
        subject: `Reminder: Message "${messageTitle}" from ${senderName}`,
        html: `
          <h2>Message Delivery Reminder</h2>
          <p>This is a reminder about a message titled: <strong>${messageTitle}</strong> from ${senderName}.</p>
          <p>This message will be delivered to you in approximately ${timeRemaining}.</p>
        `
      });
      
      results.push({ success: true, recipient: recipient.email, method: 'email' });
    } catch (emailError: any) {
      console.error(`Error sending email to recipient ${recipient.name}:`, emailError);
      results.push({ 
        success: false, 
        recipient: recipient.email, 
        method: 'email',
        error: emailError.message || 'Email sending failed'
      });
    }
    
    // If recipient has a phone number, try sending WhatsApp
    if (recipient.phone) {
      try {
        // This is a placeholder - in production, you'd implement the WhatsApp sending logic
        console.log(`Would send WhatsApp reminder to recipient at ${recipient.phone}`);
        
        // Simulate success
        results.push({ success: true, recipient: recipient.phone, method: 'whatsapp' });
      } catch (whatsappError: any) {
        console.error(`Error sending WhatsApp to recipient:`, whatsappError);
        results.push({ 
          success: false, 
          recipient: recipient.phone, 
          method: 'whatsapp',
          error: whatsappError.message || 'WhatsApp sending failed'
        });
      }
    }
  }
  
  return results;
}
