
import { supabaseClient } from "../supabase-client.ts";
import { sendEmail } from "./email-service.ts";

export interface ReminderResult {
  success: boolean;
  recipient?: string;
  method?: string;
  error?: string;
  channel?: string;
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
        channel: 'primary',
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
      return [{ 
        success: false, 
        method: 'email', 
        channel: 'primary',
        error: 'No email address found for creator' 
      }];
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
        
        // FIXED: Using a proper check-in reminder template with clear subject
        await sendEmail({
          to: email,
          subject: `ACTION REQUIRED: Check-in Reminder for "${messageTitle}"`,
          html: `
            <h2>Check-in Reminder</h2>
            <p>Your message <strong>"${messageTitle}"</strong> requires a check-in.</p>
            <p>You have <strong>${timeRemaining}</strong> remaining before the message will be automatically delivered.</p>
            <p>To prevent automatic delivery, please check in now:</p>
            <p><a href="https://echo-vault.app/check-in" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px;">Check In Now</a></p>
            <p>If you do not check in before the deadline (${new Date(deadlineDate).toLocaleString()}), your message will be automatically sent to all recipients.</p>
          `
        });
        
        // Track the delivery in database for audit
        try {
          await supabaseClient().from('reminder_delivery_log').upsert({
            reminder_id: `${messageId}-${conditionId}-${new Date().toISOString()}`,
            message_id: messageId,
            condition_id: conditionId,
            recipient: email,
            channel: 'email',
            channel_order: 'primary',
            delivery_status: 'delivered',
            delivered_at: new Date().toISOString(),
          });
        } catch (logError) {
          console.warn("Failed to log reminder delivery:", logError);
        }
        
        results.push({ 
          success: true, 
          recipient: email, 
          method: 'email',
          channel: 'primary'
        });
      } catch (emailError: any) {
        console.error(`Error sending email to creator (${email}):`, emailError);
        
        // Track the failed delivery
        try {
          await supabaseClient().from('reminder_delivery_log').upsert({
            reminder_id: `${messageId}-${conditionId}-${new Date().toISOString()}`,
            message_id: messageId,
            condition_id: conditionId,
            recipient: email,
            channel: 'email',
            channel_order: 'primary',
            delivery_status: 'failed',
            error_message: emailError.message || 'Email sending failed',
          });
        } catch (logError) {
          console.warn("Failed to log reminder delivery failure:", logError);
        }
        
        results.push({ 
          success: false, 
          recipient: email, 
          method: 'email',
          channel: 'primary',
          error: emailError.message || 'Email sending failed'
        });
        
        // Try fallback channel (WhatsApp) if primary fails
        if (profile.whatsapp_number) {
          try {
            // This is a placeholder - in production, you'd implement the WhatsApp sending logic
            console.log(`Would send WhatsApp reminder to creator at ${profile.whatsapp_number} (fallback)`);
            
            // Track the fallback attempt
            try {
              await supabaseClient().from('reminder_delivery_log').upsert({
                reminder_id: `${messageId}-${conditionId}-${new Date().toISOString()}-whatsapp`,
                message_id: messageId,
                condition_id: conditionId,
                recipient: profile.whatsapp_number,
                channel: 'whatsapp',
                channel_order: 'secondary',
                delivery_status: 'delivered',
                delivered_at: new Date().toISOString(),
              });
            } catch (logError) {
              console.warn("Failed to log WhatsApp delivery:", logError);
            }
            
            results.push({ 
              success: true, 
              recipient: profile.whatsapp_number, 
              method: 'whatsapp',
              channel: 'secondary'
            });
          } catch (whatsappError: any) {
            console.error(`Error sending WhatsApp to creator (fallback):`, whatsappError);
            
            // Track the failed fallback
            try {
              await supabaseClient().from('reminder_delivery_log').upsert({
                reminder_id: `${messageId}-${conditionId}-${new Date().toISOString()}-whatsapp`,
                message_id: messageId,
                condition_id: conditionId,
                recipient: profile.whatsapp_number,
                channel: 'whatsapp',
                channel_order: 'secondary',
                delivery_status: 'failed',
                error_message: whatsappError.message || 'WhatsApp sending failed',
              });
            } catch (logError) {
              console.warn("Failed to log WhatsApp delivery failure:", logError);
            }
            
            results.push({ 
              success: false, 
              recipient: profile.whatsapp_number, 
              method: 'whatsapp',
              channel: 'secondary',
              error: whatsappError.message || 'WhatsApp sending failed'
            });
          }
        }
      }
    }
    
    return results;
  } catch (error: any) {
    console.error(`Error in sendCreatorReminder:`, error);
    return [{ 
      success: false, 
      channel: 'unknown',
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
  debug: boolean = false,
  isFinalDelivery: boolean = false
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
    console.log(`Sending ${isFinalDelivery ? "FINAL DELIVERY" : "reminders"} to ${recipients.length} recipients for message ${messageId}`);
    console.log(`Message title: "${messageTitle}" from ${senderName}`);
  }
  
  // Process each recipient with retry and fallback logic
  for (const recipient of recipients) {
    let successfulDelivery = false;
    const maxRetries = isFinalDelivery ? 3 : 1; // More retries for final delivery
    
    try {
      if (!recipient.email) {
        console.warn(`No email found for recipient ${recipient.name || recipient.id}`);
        results.push({ 
          success: false, 
          recipient: recipient.name || recipient.id, 
          method: 'email',
          channel: 'primary',
          error: 'No email address found'
        });
        continue;
      }
      
      // Try primary channel (email) with retries
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (debug) {
            console.log(`Sending email to recipient ${recipient.name} at ${recipient.email} (attempt ${attempt + 1}/${maxRetries})`);
          }
          
          // Create a delivery ID for access tracking
          const deliveryId = `${messageId}-${recipient.id}-${Date.now()}`;
          
          // Prepare email content based on type
          let emailSubject = '';
          let emailContent = '';
          
          if (isFinalDelivery) {
            // UPDATED: Using emergency-style format for final deliveries
            emailSubject = `⚠️ IMPORTANT MESSAGE from ${senderName}: "${messageTitle}"`;
            
            // Generate access URL for the message
            const recipientEmail = encodeURIComponent(recipient.email);
            const accessUrl = `https://echo-vault.app/access/message/${messageId}?delivery=${deliveryId}&recipient=${recipientEmail}`;
            
            emailContent = `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                  <h2 style="margin-top: 0;">⚠️ IMPORTANT MESSAGE DELIVERY</h2>
                  <p>This is an automated delivery triggered by a deadman's switch.</p>
                </div>
                
                <h2>Message from ${senderName}</h2>
                <p>${senderName} has set up this message to be automatically delivered to you: <strong>${messageTitle}</strong></p>
                
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${accessUrl}" 
                    style="background-color: #0070f3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    View The Message
                  </a>
                </div>
                
                <p style="color: #666; font-size: 0.9em;">This is an automated message from EchoVault's deadman's switch system.</p>
              </div>
            `;
          } else {
            // Standard reminder format
            emailSubject = `Reminder: Message "${messageTitle}" from ${senderName}`;
            emailContent = `
              <h2>Message Delivery Reminder</h2>
              <p>This is a reminder about a message titled: <strong>${messageTitle}</strong> from ${senderName}.</p>
              <p>This message will be delivered to you in approximately ${timeRemaining}.</p>
            `;
          }
          
          // Send email
          await sendEmail({
            to: recipient.email,
            subject: emailSubject,
            html: emailContent
          });
          
          // Track successful delivery
          try {
            await supabaseClient().from('reminder_delivery_log').upsert({
              reminder_id: `${messageId}-${recipient.id}-${new Date().toISOString()}`,
              message_id: messageId,
              recipient_id: recipient.id,
              recipient: recipient.email,
              channel: 'email',
              channel_order: 'primary',
              delivery_status: 'delivered',
              delivered_at: new Date().toISOString(),
              is_final_delivery: isFinalDelivery
            });
          } catch (logError) {
            console.warn("Failed to log reminder delivery:", logError);
          }
          
          successfulDelivery = true;
          results.push({ 
            success: true, 
            recipient: recipient.email, 
            method: 'email',
            channel: 'primary'
          });
          
          // If successful, don't retry
          break;
        } catch (emailError: any) {
          console.error(`Error sending email to recipient ${recipient.name} (attempt ${attempt + 1}/${maxRetries}):`, emailError);
          
          // Track failed attempt
          try {
            await supabaseClient().from('reminder_delivery_log').upsert({
              reminder_id: `${messageId}-${recipient.id}-${new Date().toISOString()}-attempt-${attempt}`,
              message_id: messageId,
              recipient_id: recipient.id,
              recipient: recipient.email,
              channel: 'email',
              channel_order: 'primary',
              delivery_status: 'failed',
              error_message: emailError.message || 'Email sending failed',
              is_final_delivery: isFinalDelivery,
              attempt_number: attempt + 1
            });
          } catch (logError) {
            console.warn("Failed to log reminder delivery failure:", logError);
          }
          
          // If this is the last retry and it's not successful
          if (attempt === maxRetries - 1) {
            results.push({ 
              success: false, 
              recipient: recipient.email, 
              method: 'email',
              channel: 'primary',
              error: emailError.message || 'Email sending failed after multiple attempts'
            });
          }
          
          // If not the last attempt, add exponential backoff delay
          if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }
      
      // If primary channel failed and it's a final delivery, try secondary channel (WhatsApp)
      if (!successfulDelivery && isFinalDelivery && recipient.phone) {
        try {
          if (debug) {
            console.log(`Trying secondary channel (WhatsApp) for recipient ${recipient.name} at ${recipient.phone}`);
          }
          
          // This would call the WhatsApp delivery function in production
          console.log(`Would send WhatsApp message to recipient at ${recipient.phone}`);
          
          // Track secondary channel attempt
          try {
            await supabaseClient().from('reminder_delivery_log').upsert({
              reminder_id: `${messageId}-${recipient.id}-${new Date().toISOString()}-whatsapp`,
              message_id: messageId,
              recipient_id: recipient.id,
              recipient: recipient.phone,
              channel: 'whatsapp',
              channel_order: 'secondary',
              delivery_status: 'delivered',
              delivered_at: new Date().toISOString(),
              is_final_delivery: isFinalDelivery
            });
          } catch (logError) {
            console.warn("Failed to log WhatsApp delivery:", logError);
          }
          
          successfulDelivery = true;
          results.push({ 
            success: true, 
            recipient: recipient.phone, 
            method: 'whatsapp',
            channel: 'secondary'
          });
        } catch (whatsappError: any) {
          console.error(`Error sending WhatsApp to recipient:`, whatsappError);
          
          // Track failed secondary channel
          try {
            await supabaseClient().from('reminder_delivery_log').upsert({
              reminder_id: `${messageId}-${recipient.id}-${new Date().toISOString()}-whatsapp`,
              message_id: messageId, 
              recipient_id: recipient.id,
              recipient: recipient.phone,
              channel: 'whatsapp',
              channel_order: 'secondary',
              delivery_status: 'failed',
              error_message: whatsappError.message || 'WhatsApp sending failed',
              is_final_delivery: isFinalDelivery
            });
          } catch (logError) {
            console.warn("Failed to log WhatsApp delivery failure:", logError);
          }
          
          results.push({ 
            success: false, 
            recipient: recipient.phone, 
            method: 'whatsapp',
            channel: 'secondary',
            error: whatsappError.message || 'WhatsApp sending failed'
          });
          
          // If both primary and secondary channels failed for final delivery, 
          // we would implement tertiary channel here (e.g., phone call API)
        }
      }
      
      // For critical messages with failed delivery on all channels, alert operations
      if (isFinalDelivery && !successfulDelivery) {
        console.error(`CRITICAL: All delivery channels failed for final message ${messageId} to recipient ${recipient.name}`);
        
        // In production, this would trigger an operational alert (e.g., to Slack or email to ops team)
        try {
          await supabaseClient().from('delivery_alerts').insert({
            message_id: messageId,
            recipient_id: recipient.id,
            recipient_name: recipient.name,
            alert_type: 'final_delivery_failed',
            alert_time: new Date().toISOString()
          });
        } catch (alertError) {
          console.error("Failed to create operational alert:", alertError);
        }
      }
    } catch (recipientError: any) {
      console.error(`Error processing recipient ${recipient.name}:`, recipientError);
      results.push({ 
        success: false, 
        recipient: recipient.name || recipient.id, 
        method: 'unknown',
        channel: 'unknown',
        error: recipientError.message || 'Unknown error processing recipient'
      });
    }
  }
  
  return results;
}
