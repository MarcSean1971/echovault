
// Import necessary modules
import { Resend } from "npm:resend@2.0.0";
import { generateAccessUrl } from "./utils/url-generator.ts";
import { EmailTemplateData } from "./types.ts";

// Create Resend client with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * Send an email message to a recipient
 */
export async function sendEmailNotification(
  messageId: string,
  recipientEmail: string, 
  recipientName: string | null, 
  senderName: string,
  messageTitle: string,
  messageContent: string | null = null,
  location: {
    share_location?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    name?: string | null;
  } = {},
  isEmergency: boolean = false,
  appName: string = "EchoVault",
  deliveryId?: string,
  attachments: Array<{
    path: string;
    name: string;
    size: number;
    type: string;
  }> | null = null
) {
  try {
    console.log(`Sending email to ${recipientEmail}`);

    // Generate a unique delivery ID for tracking if not provided
    const finalDeliveryId = deliveryId || crypto.randomUUID();
    console.log(`Using delivery ID: ${finalDeliveryId} for message ${messageId} to ${recipientEmail}`);

    // Generate access URL for this message and recipient
    const accessUrl = generateAccessUrl(messageId, recipientEmail, finalDeliveryId);
    console.log(`Access URL for ${recipientEmail}: ${accessUrl}`);
    
    // Log environment variables (without values) to help diagnose URL issues
    const availableEnvVars = Object.keys(Deno.env.toObject()).join(', ');
    console.log(`Available environment variables: ${availableEnvVars}`);
    
    // Check if APP_DOMAIN is set
    const appDomain = Deno.env.get("APP_DOMAIN");
    console.log(`APP_DOMAIN environment variable is ${appDomain ? "set to: " + appDomain : "not set"}`);

    // Set subject type based on emergency status but don't use "EMERGENCY" phrase
    const subjectPrefix = isEmergency ? `Alert: ` : "";
    
    // Send the email with a modern, responsive template similar to the welcome email
    const emailResponse = await resend.emails.send({
      from: `${appName} <notifications@echo-vault.app>`,
      to: [recipientEmail],
      subject: `${subjectPrefix}${senderName} sent you a message: "${messageTitle}"`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>Secure Message from ${senderName}</title>
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
              <h1 style="color: #ffffff; margin-top: 0; font-size: 28px;">${appName}</h1>
              <p style="font-size: 18px; margin-bottom: 0; color: #ffffff;">Alert Notification</p>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 20px; font-weight: 600;">${messageTitle}</h2>
              
              <p style="color: #475569; margin-bottom: 20px; font-size: 16px;">
                <strong>${senderName}</strong> has sent you a secure message.
              </p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #9b87f5; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #6E59A5;">What is ${appName}?</h3>
                <p style="margin-bottom: 10px; line-height: 1.6;">
                  ${appName} is a secure digital vault that ensures important messages and documents reach the right people at the right time. It helps people share critical information that only gets released when specific conditions are met:
                </p>
                <ul style="margin-bottom: 0;">
                  <li style="margin-bottom: 8px;">When someone hasn't checked in for a specified period</li>
                  <li style="margin-bottom: 8px;">On a scheduled future date</li>
                  <li style="margin-bottom: 8px;">In emergency situations</li>
                  <li style="margin-bottom: 0;">With group confirmation requirements</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${accessUrl}" style="display: inline-block; background-color: #9b87f5; color: white; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; transition: all 0.2s ease;">
                  View Secure Message
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 14px; word-break: break-all;">
                <a href="${accessUrl}" style="color: #9b87f5; text-decoration: none;">${accessUrl}</a>
              </p>
            </div>
            
            <div style="padding: 24px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
                © ${new Date().getFullYear()} ${appName} - Secure Message Delivery
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Return success
    return { success: true, deliveryId: finalDeliveryId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Return error details
    return { 
      success: false, 
      error: error.message || "Unknown error",
      statusCode: error.statusCode,
      details: error.toString(),
      deliveryId: null 
    };
  }
}

// Add the alias function to maintain compatibility with older code
export const sendEmailToRecipient = (
  recipientEmail: string, 
  data: EmailTemplateData
) => {
  return sendEmailNotification(
    data.accessUrl.split('id=')[1]?.split('&')[0] || '', // Extract message ID from URL
    recipientEmail,
    data.recipientName,
    data.senderName,
    data.messageTitle,
    data.messageContent,
    {
      share_location: data.shareLocation,
      latitude: data.locationLatitude,
      longitude: data.locationLongitude,
      name: data.locationName
    },
    data.isEmergency || false,
    undefined, // Use default app name
    undefined, // No delivery ID for this legacy function
    data.attachments // Pass attachments
  );
};
