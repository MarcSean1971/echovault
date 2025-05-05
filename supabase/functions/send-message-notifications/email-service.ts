
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

    // Determine emergency styling and messaging
    const subjectPrefix = isEmergency ? `⚠️ EMERGENCY FROM ${senderName.toUpperCase()}: ` : "";
    const emergencyBanner = isEmergency 
      ? `<div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
          <strong>EMERGENCY MESSAGE FROM ${senderName.toUpperCase()}:</strong> This is an urgent communication that requires your immediate attention.
        </div>`
      : "";
      
    // Add location information if available and sharing is enabled
    let locationHtml = "";
    if (location.share_location === true && 
        location.latitude !== null && 
        location.longitude !== null) {
      
      const locationName = location.name ? location.name : `${location.latitude}, ${location.longitude}`;
      
      locationHtml = `
        <div style="background-color: #f0f8ff; border-left: 4px solid #4285f4; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold;">📍 ${senderName}'s Location: ${locationName}</p>
          <p style="margin: 10px 0 0 0;">
            <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" 
               style="color: #4285f4; text-decoration: underline;">View on Google Maps</a>
          </p>
        </div>
      `;
    }

    // Simplified attachment notification - just mention if there are attachments
    let attachmentsHtml = "";
    if (attachments && attachments.length > 0) {
      attachmentsHtml = `
        <div style="background-color: #f5f5f5; border-left: 4px solid #555; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold;">📁 This message includes ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}</p>
          <p style="margin: 10px 0 0 0; font-style: italic; font-size: 13px;">
            Click the button below to access the secure message and view attachments.
          </p>
        </div>
      `;
    }

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
          
          ${messageContent ? `
          <div style="background-color: #f7f7f7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">${messageContent}</p>
          </div>
          ` : ''}
          
          ${locationHtml}
          
          ${attachmentsHtml}
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            This message has been secured and can only be accessed through the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${accessUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              View Secure Message
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
