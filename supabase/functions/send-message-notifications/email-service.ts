
// Import necessary modules
import { Resend } from "npm:resend@2.0.0";
import { generateAccessUrl } from "./notification-service.ts";
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
  isEmergency: boolean = false,
  appName: string = "EchoVault"
) {
  try {
    console.log(`Sending email to ${recipientEmail}`);

    // Generate a unique delivery ID for tracking
    const deliveryId = crypto.randomUUID();

    // Generate access URL for this message and recipient
    const accessUrl = generateAccessUrl(messageId, recipientEmail, deliveryId);
    console.log(`Access URL for ${recipientEmail}: ${accessUrl}`);

    // Determine emergency styling and messaging
    const subjectPrefix = isEmergency ? "⚠️ EMERGENCY: " : "";
    const emergencyBanner = isEmergency 
      ? `<div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
          <strong>EMERGENCY MESSAGE:</strong> This is an urgent communication that requires your immediate attention.
        </div>`
      : "";

    // Send the email
    const emailResponse = await resend.emails.send({
      from: `${appName} <notifications@echo-vault.app>`,
      to: [recipientEmail],
      subject: `${subjectPrefix}${senderName} has sent you a secure message: "${messageTitle}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          ${emergencyBanner}
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">${appName}</h1>
            <p style="font-size: 16px; margin-bottom: 0;">Secure Message Notification</p>
          </div>
          
          <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Hello ${recipientName || "there"},</h2>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            <strong>${senderName}</strong> has sent you a secure message titled "<strong>${messageTitle}</strong>".
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            This message has been secured and can only be accessed through the link below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${accessUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Access Secure Message
            </a>
          </div>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic;">
              Please note that the message may have additional security measures in place, such as a PIN code or a delayed access time, depending on the sender's preferences.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; font-size: 14px; color: #666;">
            <p>This email was sent from a notification-only address that cannot accept incoming email. Please do not reply to this message.</p>
            <p style="margin-bottom: 0;">© ${new Date().getFullYear()} ${appName} Service</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Return success
    return { success: true, deliveryId };
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
    data.isEmergency || false
  );
};
