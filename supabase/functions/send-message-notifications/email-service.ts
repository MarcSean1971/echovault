
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

    // Set emergency styling if needed
    const subjectPrefix = isEmergency ? `⚠️ EMERGENCY: ` : "";
    const emergencyBanner = isEmergency 
      ? `<div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px;">
          <strong>⚠️ EMERGENCY MESSAGE:</strong> This message requires your immediate attention.
        </div>`
      : "";
      
    // Add location information if available and sharing is enabled
    let locationHtml = "";
    if (location.share_location === true && 
        location.latitude !== null && 
        location.longitude !== null) {
      
      const locationName = location.name ? location.name : `${location.latitude}, ${location.longitude}`;
      
      locationHtml = `
        <div style="margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">📍 Shared location: ${locationName}</p>
          <p style="margin: 10px 0 0 0;">
            <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" 
               style="color: #4285f4; text-decoration: underline;">View on Google Maps</a>
          </p>
        </div>
      `;
    }

    // Simplified attachment notification
    let attachmentsHtml = "";
    if (attachments && attachments.length > 0) {
      attachmentsHtml = `
        <div style="margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">📁 ${attachments.length} attachment${attachments.length > 1 ? 's' : ''} included</p>
        </div>
      `;
    }

    // Send the email with a much simpler template
    const emailResponse = await resend.emails.send({
      from: `${appName} <notifications@echo-vault.app>`,
      to: [recipientEmail],
      subject: `${subjectPrefix}${senderName} sent you a message: "${messageTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${emergencyBanner}
          
          <h1 style="color: #2563eb;">${messageTitle}</h1>
          
          <p style="font-size: 16px; margin: 16px 0;">
            <strong>${senderName}</strong> has sent you a secure message.
          </p>
          
          ${messageContent ? `
          <div style="background-color: #f7f7f7; padding: 15px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0;">${messageContent}</p>
          </div>
          ` : ''}
          
          ${locationHtml}
          
          ${attachmentsHtml}
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${accessUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              View Message
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${accessUrl}" style="color: #2563eb; word-break: break-all;">${accessUrl}</a>
          </p>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This email was sent from a notification-only address.</p>
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
