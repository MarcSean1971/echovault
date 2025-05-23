import { supabaseClient } from "../supabase-client.ts";
import { Resend } from "npm:resend@2.0.0";
import { generateAccessUrl } from "../utils/url-generator.ts";

// Initialize email client with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Define types for better parameter handling
interface ReminderResult {
  success: boolean;
  recipient: string;
  channel: 'email' | 'whatsapp' | 'system';
  messageId?: string;
  error?: string | null;
}

/**
 * Send reminder to creator about their check-in deadline
 * FIXED: Updated parameter list and fixed creator email issue
 */
export async function sendCreatorReminder(
  messageId: string,
  conditionId: string,
  messageTitle: string,
  creatorUserId: string,
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false
): Promise<ReminderResult[]> {
  try {
    if (!creatorUserId) {
      console.error("Creator user ID is missing in sendCreatorReminder!");
      return [{ success: false, recipient: "unknown", channel: 'system', error: "Missing creator user ID" }];
    }

    // Get creator's primary email from auth.users table
    const supabase = supabaseClient();
    
    // First try to get the profile data which may have more info
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, backup_email')
      .eq('id', creatorUserId)
      .single();
    
    if (debug) {
      console.log(`[REMINDER-SENDER] Retrieved profile for user ${creatorUserId}:`, 
        profileError ? `ERROR: ${profileError.message}` : 
        profileData ? `SUCCESS: ${JSON.stringify(profileData)}` : "No profile data found");
    }
    
    // CRITICAL FIX: Get the user's email from auth.users as fallback
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(creatorUserId);
    
    if (debug) {
      console.log(`[REMINDER-SENDER] Retrieved auth user data for ${creatorUserId}:`, 
        userError ? `ERROR: ${userError.message}` : 
        userData ? `SUCCESS with email ${userData.user?.email}` : "No user data found");
    }
    
    // Get the best email we have for the user - first try profile, then auth user
    const creatorEmail = userData?.user?.email;
    const creatorName = profileData?.first_name 
      ? `${profileData.first_name} ${profileData.last_name || ''}`
      : "User";
    
    if (!creatorEmail) {
      console.error(`[REMINDER-SENDER] No email found for creator ${creatorUserId}`);
      return [{ 
        success: false, 
        recipient: "unknown", 
        channel: 'email', 
        error: "No email found for creator" 
      }];
    }
    
    if (debug) {
      console.log(`[REMINDER-SENDER] Sending check-in reminder to creator ${creatorName} (${creatorEmail})`);
      console.log(`[REMINDER-SENDER] Message ID: ${messageId}, Title: ${messageTitle}`);
      console.log(`[REMINDER-SENDER] Hours until deadline: ${hoursUntilDeadline}`);
    }
    
    // Format the time remaining in a user-friendly way
    const timeRemaining = formatTimeRemaining(hoursUntilDeadline);
    
    // Generate the access URL for the message
    const accessUrl = generateAccessUrl(messageId, creatorEmail);
    
    // CRITICAL FIX: Use proper HTML template specific for creator check-in reminders
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-In Reminder</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #334155;
            background-color: #f8fafc;
            padding: 24px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background-color: #9b87f5;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .action-button {
            display: inline-block;
            background-color: #9b87f5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 24px;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 16px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
          }
          .warning-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .time-remaining {
            font-weight: bold;
            font-size: 18px;
            color: #ef4444;
          }
          .deadline-info {
            margin-bottom: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Check-In Reminder</h1>
          </div>
          <div class="content">
            <p><strong>Hello ${creatorName},</strong></p>
            
            <p>This is a reminder to check in for your message:</p>
            <h2 style="color: #1e293b; margin-bottom: 16px;">${messageTitle}</h2>
            
            <div class="warning-box">
              <div class="deadline-info">
                <p>You need to check in <span class="time-remaining">within ${timeRemaining}</span> or your message will be automatically delivered to recipients.</p>
              </div>
            </div>
            
            <p>To check in and reset the timer, please click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${accessUrl}" class="action-button">Check In Now</a>
            </div>
            
            <p style="margin-top: 24px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background-color: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 14px; word-break: break-all;">
              <a href="${accessUrl}" style="color: #9b87f5; text-decoration: none;">${accessUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated reminder from EchoVault. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} EchoVault - Secure Message Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Send email using Resend API
      const emailResponse = await resend.emails.send({
        from: `EchoVault <notifications@echo-vault.app>`,
        to: [creatorEmail],
        subject: `🔔 Check-In Reminder for "${messageTitle}" - ${timeRemaining} Remaining`,
        html: html,
      });

      if (debug) {
        console.log(`[REMINDER-SENDER] Email sent to creator:`, emailResponse);
      }

      return [{
        success: true,
        recipient: creatorEmail,
        channel: 'email',
        messageId: typeof emailResponse.id === 'string' ? emailResponse.id : undefined
      }];
    } catch (emailError: any) {
      console.error(`[REMINDER-SENDER] Error sending creator reminder email:`, emailError);
      
      return [{
        success: false,
        recipient: creatorEmail,
        channel: 'email',
        error: emailError.message || "Unknown email sending error"
      }];
    }
  } catch (error: any) {
    console.error(`[REMINDER-SENDER] Error in sendCreatorReminder:`, error);
    
    return [{
      success: false,
      recipient: "unknown",
      channel: 'system',
      error: error.message || "Unknown system error"
    }];
  }
}

/**
 * Send reminder emails to recipients about upcoming message
 */
export async function sendRecipientReminders(
  messageId: string,
  messageTitle: string,
  senderName: string,
  recipients: any[],
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false,
  isFinalDelivery: boolean = false
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  
  // Process each recipient
  for (const recipient of recipients) {
    try {
      if (!recipient.email) {
        console.warn(`Recipient has no email address: ${recipient.name || 'Unknown'}`);
        continue;
      }
      
      // Generate access URL for this recipient
      const accessUrl = generateAccessUrl(messageId, recipient.email);
      
      // Format the time remaining in a user-friendly way
      const timeRemaining = formatTimeRemaining(hoursUntilDeadline);
      
      // Use a different email template based on whether this is final delivery or a reminder
      let subject, html;
      
      if (isFinalDelivery) {
        subject = `Important Message from ${senderName}: "${messageTitle}"`;
        html = `
          <!DOCTYPE html>
          <html lang="en">
          <!-- Final delivery email template -->
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Message Delivery</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.5;
                color: #334155;
                background-color: #f8fafc;
                padding: 24px;
                margin: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              }
              .header {
                background-color: #9b87f5;
                padding: 24px;
                text-align: center;
              }
              .header h1 {
                color: white;
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content {
                padding: 32px;
              }
              .action-button {
                display: inline-block;
                background-color: #9b87f5;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                margin-top: 24px;
              }
              .footer {
                background-color: #f1f5f9;
                padding: 16px;
                text-align: center;
                font-size: 14px;
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Message Delivery</h1>
              </div>
              <div class="content">
                <p><strong>Hello ${recipient.name || 'there'},</strong></p>
                
                <p>${senderName} has sent you an important message that is now available:</p>
                <h2 style="color: #1e293b; margin-bottom: 16px;">${messageTitle}</h2>
                
                <p>To view this message, please click the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${accessUrl}" class="action-button">View Message</a>
                </div>
                
                <p style="margin-top: 24px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="background-color: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 14px; word-break: break-all;">
                  <a href="${accessUrl}" style="color: #9b87f5; text-decoration: none;">${accessUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>This message was delivered through EchoVault. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        subject = `Upcoming Message from ${senderName} - Available in ${timeRemaining}`;
        html = `
          <!DOCTYPE html>
          <html lang="en">
          <!-- Reminder email template -->
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Message Reminder</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.5;
                color: #334155;
                background-color: #f8fafc;
                padding: 24px;
                margin: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              }
              .header {
                background-color: #9b87f5;
                padding: 24px;
                text-align: center;
              }
              .header h1 {
                color: white;
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content {
                padding: 32px;
              }
              .footer {
                background-color: #f1f5f9;
                padding: 16px;
                text-align: center;
                font-size: 14px;
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Upcoming Message</h1>
              </div>
              <div class="content">
                <p><strong>Hello ${recipient.name || 'there'},</strong></p>
                
                <p>This is a reminder that ${senderName} has sent you a message that will be available in ${timeRemaining}:</p>
                <h2 style="color: #1e293b; margin-bottom: 16px;">${messageTitle}</h2>
                
                <p>You'll receive another notification when the message is available for viewing.</p>
              </div>
              <div class="footer">
                <p>This is an automated reminder from EchoVault. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      // Send email using Resend API
      const emailResponse = await resend.emails.send({
        from: `EchoVault <notifications@echo-vault.app>`,
        to: [recipient.email],
        subject: subject,
        html: html,
      });

      if (debug) {
        console.log(`[REMINDER-SENDER] Email sent to recipient ${recipient.email}:`, emailResponse);
      }

      results.push({
        success: true,
        recipient: recipient.email,
        channel: 'email',
        messageId: typeof emailResponse.id === 'string' ? emailResponse.id : undefined
      });
    } catch (error: any) {
      console.error(`[REMINDER-SENDER] Error sending email to ${recipient.email}:`, error);
      
      results.push({
        success: false,
        recipient: recipient.email || "unknown",
        channel: 'email',
        error: error.message || "Unknown email sending error"
      });
    }
  }
  
  return results;
}

/**
 * Format hours until deadline in a user-friendly way
 */
function formatTimeRemaining(hours: number): string {
  if (isNaN(hours) || hours < 0) {
    return "now";
  }

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (hours < 24) {
    const roundedHours = Math.round(hours);
    return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  return `${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
}
