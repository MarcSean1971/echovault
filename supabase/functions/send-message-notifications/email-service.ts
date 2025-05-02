import { Resend } from "npm:resend@2.0.0";
import { EmailTemplateData } from "./types.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

// Check if the RESEND_API_KEY is set
if (!resendApiKey) {
  console.error("WARNING: RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendApiKey);

export async function sendEmailToRecipient(
  recipientEmail: string, 
  data: EmailTemplateData
) {
  // Generate the appropriate email template based on security settings and message type
  const template = generateEmailTemplate(data);
  
  // For emergency messages, add urgent flags in the subject
  const subject = data.isEmergency
    ? `⚠️ URGENT EMERGENCY MESSAGE: "${data.messageTitle}"`
    : `Secure Message: "${data.messageTitle}" is now available`;
  
  console.log(`Sending email to ${recipientEmail} with subject "${subject}"`);
  console.log(`Is emergency: ${data.isEmergency ? 'yes' : 'no'}`);
  
  try {
    console.log("Sending email with Resend using API key:", resendApiKey ? "API key is set" : "API key is NOT set");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }
    
    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: `EchoVault <notifications@echovault.org>`,
      to: [recipientEmail],
      subject: subject,
      html: template,
      // For emergency messages, set high priority
      headers: data.isEmergency ? {
        'X-Priority': '1',
        'Importance': 'high',
        'X-Emergency': 'true' // Custom header to track emergency messages
      } : undefined
    });
    
    if (emailResponse.error) {
      console.error("Error sending email through Resend:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }
    
    console.log(`Email sent successfully to ${recipientEmail}, ID: ${emailResponse.data?.id}`);
    
    return emailResponse;
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
    throw error;
  }
}

function generateEmailTemplate(data: EmailTemplateData): string {
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Security notes based on message settings
  const securityNotes = [];
  
  if (data.hasPinCode) {
    securityNotes.push(`
      <div class="security-note">
        <strong>PIN Protected:</strong> You will need a PIN code to view this message. Please contact the sender if you haven't received this PIN.
      </div>
    `);
  }
  
  if (data.hasDelayedAccess) {
    securityNotes.push(`
      <div class="security-note">
        <strong>Delayed Access:</strong> This message will become available for viewing on ${formatDate(data.unlockDate)}.
      </div>
    `);
  }
  
  if (data.hasExpiry) {
    securityNotes.push(`
      <div class="security-note">
        <strong>Message Expiration:</strong> This message will expire and no longer be accessible after ${formatDate(data.expiryDate)}.
      </div>
    `);
  }
  
  // Different message type descriptions
  let contentTypeDescription = 'text message';
  if (data.messageType === 'voice') {
    contentTypeDescription = 'voice recording';
  } else if (data.messageType === 'video') {
    contentTypeDescription = 'video message';
  }
  
  // Emergency styling
  const headerStyle = data.isEmergency 
    ? `background-color: #e11d48; color: white;` 
    : `background-color: #2563eb; color: white;`;
  
  const buttonStyle = data.isEmergency
    ? `background-color: #e11d48; color: white;`
    : `background-color: #2563eb; color: white;`;
  
  // Emergency warning content
  const emergencyWarning = data.isEmergency
    ? `
      <div style="background-color: #fee2e2; border-left: 4px solid #e11d48; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="color: #e11d48; margin-top: 0;">⚠️ EMERGENCY NOTICE</h3>
        <p>This message was triggered as an <strong>emergency alert</strong> and requires your immediate attention.</p>
      </div>
    `
    : '';
  
  // Main email template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${data.isEmergency ? 'EMERGENCY MESSAGE' : 'Secure Message Notification'}</title>
      <style>
        body {
          font-family: sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          ${headerStyle}
          padding: 20px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 0;
        }
        .content {
          background-color: #f8fafc;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
        }
        .button {
          ${buttonStyle}
          padding: 12px 20px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          margin: 20px 0;
          font-weight: bold;
        }
        .security-note {
          background-color: #fef9c3;
          border-left: 4px solid #eab308;
          padding: 12px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .footer {
          font-size: 12px;
          color: #6b7280;
          margin-top: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">EchoVault</div>
        <p>${data.isEmergency ? 'EMERGENCY MESSAGE' : 'Secure Message Notification'}</p>
      </div>
      
      <div class="content">
        <h2>Hello ${data.recipientName},</h2>
        
        ${emergencyWarning}
        
        <p>A secure ${contentTypeDescription} titled "<strong>${data.messageTitle}</strong>" from ${data.senderName} is now available for you to access.</p>
        
        ${securityNotes.join('')}
        
        <a href="${data.accessUrl}" class="button">Access Secure Message</a>
        
        <p>If you're unable to click the button above, copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all; font-size: 12px;">${data.accessUrl}</p>
        
        <div class="footer">
          <p>This email was sent securely from EchoVault.</p>
          <p>For security reasons, this link is unique to you and should not be shared.</p>
          <p>&copy; ${new Date().getFullYear()} EchoVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
