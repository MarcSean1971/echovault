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
    
    // Format file sizes for display
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    };
    
    // Process attachments for display
    let attachmentsSection = '';
    if (attachments && attachments.length > 0) {
      const attachmentItems = attachments.map(att => {
        return `<div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background-color: #f5f7fa; border-radius: 6px;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; margin-right: 12px; background-color: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #64748b;">
            <span style="font-size: 14px;">📄</span>
          </div>
          <div style="flex-grow: 1; overflow: hidden;">
            <p style="margin: 0; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${att.name}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${formatFileSize(att.size)}</p>
          </div>
        </div>`;
      }).join('');
            
      attachmentsSection = `
        <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #334155; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📎</span> 
            ${attachments.length} Attachment${attachments.length > 1 ? 's' : ''}
          </p>
          ${attachmentItems}
        </div>
      `;
    }

    // Parse messageContent to handle video content properly
    let displayContent = messageContent;
    if (messageContent) {
      try {
        // Try to parse as JSON to extract video content properly
        const contentObj = JSON.parse(messageContent);
        
        // If this is video content, don't display raw JSON
        if (contentObj.videoData || contentObj.transcription) {
          // Just show transcription if available, skip raw video data
          displayContent = contentObj.transcription ? 
            `<p style="margin-top: 12px;">Video message with transcription:</p>
             <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #cbd5e1;">
               <p style="color: #334155; font-style: italic;">${contentObj.transcription}</p>
             </div>` : 
            "<p style=\"margin-top: 12px;\">This message contains a video that you can view by clicking the button below.</p>";
            
          // If there's additional text with the video, include it
          if (contentObj.additionalText) {
            displayContent += `
              <div style="margin-top: 16px;">
                <p style="margin-bottom: 8px; font-weight: 500; color: #334155;">Additional message:</p>
                <p style="color: #334155;">${contentObj.additionalText}</p>
              </div>
            `;
          }
        }
      } catch (e) {
        // Not JSON or parsing failed, use content as is
        console.log("Not JSON content, using as plain text");
      }
    }

    // Set emergency styling if needed
    const subjectPrefix = isEmergency ? `⚠️ EMERGENCY: ` : "";
    const emergencyBanner = isEmergency 
      ? `<div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 6px;">
          <p style="margin: 0; font-weight: 600; color: #b91c1c; display: flex; align-items: center;">
            <span style="margin-right: 8px; font-size: 20px;">⚠️</span>
            EMERGENCY MESSAGE
          </p>
          <p style="margin: 8px 0 0 0; color: #7f1d1d;">
            This message requires your immediate attention.
          </p>
        </div>`
      : "";
      
    // Add location information if available and sharing is enabled
    let locationHtml = "";
    if (location.share_location === true && 
        location.latitude !== null && 
        location.longitude !== null) {
      
      const locationName = location.name ? location.name : `${location.latitude}, ${location.longitude}`;
      
      locationHtml = `
        <div style="margin: 24px 0; padding: 16px; background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #0369a1; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📍</span> 
            Shared Location
          </p>
          <p style="margin: 0 0 12px 0; color: #0c4a6e;">${locationName}</p>
          <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" 
             style="display: inline-block; padding: 8px 16px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
            View on Google Maps
          </a>
        </div>
      `;
    }
    
    // Send the email with a modern, responsive template
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
            <div style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700;">${appName}</h1>
            </div>
            
            <div style="padding: 32px;">
              ${emergencyBanner}
              
              <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 16px; font-weight: 600;">${messageTitle}</h2>
              
              <p style="color: #475569; margin-bottom: 16px; font-size: 16px;">
                <strong>${senderName}</strong> has sent you a secure message.
              </p>
              
              ${displayContent ? `
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #cbd5e1;">
                ${displayContent}
              </div>
              ` : ''}
              
              ${locationHtml}
              
              ${attachmentsSection}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${accessUrl}" style="display: inline-block; background-color: #2563eb; color: white; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 16px; transition: all 0.2s ease;">
                  View Secure Message
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 8px; font-size: 14px; word-break: break-all;">
                <a href="${accessUrl}" style="color: #2563eb; text-decoration: none;">${accessUrl}</a>
              </p>
            </div>
            
            <div style="padding: 24px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #64748b; font-size: 14px; margin-top: 8px;">
                Powered by ${appName} - Secure Message Delivery
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
