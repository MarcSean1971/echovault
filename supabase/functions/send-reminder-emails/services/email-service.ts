
import { Resend } from "npm:resend@2.0.0";
import { formatDeadlineTime } from "../utils.ts";

// Create Resend client with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * Send an email reminder for a message
 */
export async function sendEmailReminder(
  messageId: string,
  recipientEmail: string,
  recipientName: string | null,
  senderName: string,
  messageTitle: string,
  hoursUntilDeadline: number,
  deadlineISOString: string,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    if (debug) {
      console.log(`Sending email reminder to ${recipientEmail} for message "${messageTitle}"`);
    }

    // Format the deadline for display
    const deadlineTime = formatDeadlineTime(deadlineISOString);
    const roundedHours = Math.round(hoursUntilDeadline);
    const appDomain = Deno.env.get("APP_DOMAIN") || "https://app.echo-vault.app";
    
    // Generate message URL
    const messageUrl = `${appDomain}/message/${messageId}`;
    
    // Send the email with a modern, responsive template
    const emailResponse = await resend.emails.send({
      from: "EchoVault Reminders <reminders@echo-vault.app>",
      to: [recipientEmail],
      subject: `⏰ Reminder: "${messageTitle}" will trigger in ${roundedHours} hours`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>Message Reminder from ${senderName}</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5; background-color: #f8fafc; padding: 24px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <div style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700;">Message Reminder</h1>
            </div>
            
            <div style="padding: 32px;">
              <div style="background-color: #fef2f2; border-left: 4px solid #f87171; padding: 16px; margin-bottom: 24px; border-radius: 6px;">
                <p style="margin: 0; font-weight: 600; color: #b91c1c; display: flex; align-items: center;">
                  <span style="margin-right: 8px; font-size: 20px;">⏰</span>
                  Reminder: This message will trigger soon!
                </p>
              </div>
              
              <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 16px; font-weight: 600;">${messageTitle}</h2>
              
              <p style="color: #475569; margin-bottom: 16px; font-size: 16px;">
                <strong>${senderName}</strong> has scheduled a message that will be delivered in <strong>${roundedHours} hours</strong> (on ${deadlineTime}) unless it's disarmed.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${messageUrl}" style="display: inline-block; background-color: #2563eb; color: white; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 16px; transition: all 0.2s ease;">
                  View Message Details
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 14px; word-break: break-all;">
                <a href="${messageUrl}" style="color: #2563eb; text-decoration: none;">${messageUrl}</a>
              </p>
            </div>
            
            <div style="padding: 24px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                This is an automated reminder. Please do not reply to this email.
              </p>
              <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
                Powered by EchoVault - Secure Message Delivery
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (debug) {
      console.log("Email reminder sent successfully:", emailResponse);
    }

    // Return success
    return { success: true };
  } catch (error: any) {
    console.error("Error sending email reminder:", error);
    
    // Return error details
    return { 
      success: false, 
      error: error.message || "Unknown error"
    };
  }
}
