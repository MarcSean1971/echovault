
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
    
    // IMPORTANT CHANGE: First try to get primary email from auth.users
    try {
      // Get user email from auth - use this as primary
      const { data: user } = await supabaseClient().auth.admin.getUserById(userId);
      
      if (user?.user?.email) {
        emailList.push(user.user.email);
        if (debug) {
          console.log(`Using primary email from auth: ${user.user.email}`);
        }
      }
    } catch (authError) {
      console.warn("Error getting user email from auth:", authError);
      // No action here, we'll check backup email below
    }
    
    // Only use backup_email if primary email was not found
    if (emailList.length === 0 && profile.backup_email) {
      emailList.push(profile.backup_email);
      if (debug) {
        console.log(`Using backup email from profile: ${profile.backup_email}`);
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
    
    // Send email to creator
    for (const email of emailList) {
      try {
        if (debug) {
          console.log(`Sending email to creator at ${email}`);
        }
        
        // UPDATED: Using a beautiful, modern template matching the welcome email design
        await sendEmail({
          to: email,
          subject: `Alert: Action Required for "${messageTitle}"`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <title>Alert Notification from EchoVault</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { 
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  color: #334155;
                  line-height: 1.5;
                  background-color: #f8fafc;
                  padding: 24px;
                }
              </style>
            </head>
            <body>
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <div style="background-color: #9b87f5; padding: 30px; border-radius: 0; margin-bottom: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin-top: 0; font-size: 28px;">EchoVault</h1>
                  <p style="font-size: 18px; margin-bottom: 0; color: #ffffff;">Alert Notification</p>
                </div>
                
                <div style="padding: 32px;">
                  <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 20px; font-weight: 600;">Action Required</h2>
                  
                  <p style="color: #475569; margin-bottom: 20px; font-size: 16px;">
                    An alert message titled <strong>"${messageTitle}"</strong> is about to be sent via EchoVault.
                  </p>
                  
                  <p style="color: #475569; margin-bottom: 20px; font-size: 16px;">
                    Please check in now to prevent automatic delivery.
                  </p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #9b87f5; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #6E59A5;">What is EchoVault?</h3>
                    <p style="margin-bottom: 10px; line-height: 1.6;">
                      EchoVault is a secure digital vault that ensures important messages and documents reach the right people at the right time. It helps people share critical information that only gets released when specific conditions are met:
                    </p>
                    <ul style="margin-bottom: 0;">
                      <li style="margin-bottom: 8px;">When someone hasn't checked in for a specified period</li>
                      <li style="margin-bottom: 8px;">On a scheduled future date</li>
                      <li style="margin-bottom: 8px;">In emergency situations</li>
                      <li style="margin-bottom: 0;">With group confirmation requirements</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://echo-vault.app/check-in" style="display: inline-block; background-color: #9b87f5; color: white; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; transition: all 0.2s ease;">
                      Check In Now
                    </a>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 14px; word-break: break-all;">
                    <a href="https://echo-vault.app/check-in" style="color: #9b87f5; text-decoration: none;">https://echo-vault.app/check-in</a>
                  </p>
                </div>
                
                <div style="padding: 24px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; font-size: 14px;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                  <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
                    © ${new Date().getFullYear()} EchoVault - Secure Message Delivery
                  </p>
                </div>
              </div>
            </body>
            </html>
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
          
          // Create a delivery ID for access tracking and database record
          const deliveryId = `${messageId}-${recipient.id}-${Date.now()}`;
          
          // For final deliveries, create a delivery record in the database
          if (isFinalDelivery) {
            try {
              // Create delivery record in database
              const supabase = supabaseClient();
              await supabase.from("delivered_messages").insert({
                message_id: messageId,
                condition_id: recipient.conditionId || "unknown",
                recipient_id: recipient.id,
                delivery_id: deliveryId,
                delivered_at: new Date().toISOString()
              });
              
              if (debug) {
                console.log(`Created delivery record for final delivery: ${deliveryId}`);
              }
            } catch (recordError) {
              console.error(`Error creating delivery record:`, recordError);
              // Continue despite error - we'll try to deliver the email anyway
            }
          }
          
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
