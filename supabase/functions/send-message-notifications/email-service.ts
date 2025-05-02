
import { EmailTemplateData } from "./types.ts";

export async function sendEmailToRecipient(
  recipientEmail: string,
  data: EmailTemplateData
): Promise<{ success: boolean; message?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    throw new Error("Email configuration missing");
  }
  
  const { 
    senderName,
    messageTitle, 
    recipientName, 
    messageType, 
    hasPinCode,
    hasDelayedAccess,
    hasExpiry,
    unlockDate,
    expiryDate,
    accessUrl,
    isEmergency = false
  } = data;

  let subject = `Secure message from ${senderName}`;
  let textPriority = "";
  
  // Adjust subject based on message type and urgency
  if (isEmergency) {
    subject = `⚠️ URGENT: Emergency message from ${senderName}`;
    textPriority = "[URGENT] ";
  }
  
  // Generate a better secure message link from the access URL
  // It should point to the actual access-message function
  const secureUrl = accessUrl;
  
  // Generate content based on message type and security features
  let securityDetails = "";
  if (hasPinCode) {
    securityDetails += "• This message is protected by a PIN code. You will need the PIN from the sender.\n";
  }
  if (hasDelayedAccess && unlockDate) {
    const readableDate = new Date(unlockDate).toLocaleString();
    securityDetails += `• This message will be accessible after ${readableDate}.\n`;
  }
  if (hasExpiry && expiryDate) {
    const readableDate = new Date(expiryDate).toLocaleString();
    securityDetails += `• This message will expire on ${readableDate}.\n`;
  }
  
  let buttonStyle = 'background-color: #0070f3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; font-weight: bold;';
  let urgentStyle = '';
  
  if (isEmergency) {
    buttonStyle = 'background-color: #d32f2f; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; font-weight: bold;';
    urgentStyle = 'background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin-bottom: 20px;';
  }
  
  // HTML content for email
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Message</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
      }
      .container {
        padding: 20px;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .footer {
        margin-top: 40px;
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      .security-details {
        background-color: #f5f5f5;
        padding: 15px;
        margin: 20px 0;
        border-left: 4px solid #0070f3;
      }
      .urgent-notice {
        ${urgentStyle}
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${isEmergency ? '⚠️ URGENT MESSAGE ⚠️' : 'Secure Message'}</h1>
      </div>
      
      ${isEmergency ? `
      <div class="urgent-notice">
        <h2>You've received an emergency message</h2>
        <p>This is an urgent communication sent through EchoVault's emergency system.</p>
      </div>
      ` : ''}
      
      <p>Hello ${recipientName},</p>
      
      <p>${senderName} has sent you a secure message: <strong>${messageTitle}</strong></p>
      
      ${securityDetails ? `
      <div class="security-details">
        <h3>Security Information</h3>
        <p>${securityDetails.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="${secureUrl}" style="${buttonStyle}">Access Secure Message</a>
      </div>
      
      <p>If you're unable to click the button above, copy and paste the following link into your web browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; font-family: monospace; font-size: 12px;">${secureUrl}</p>
      
      <div class="footer">
        <p>This message was sent securely through EchoVault. The content can only be accessed by verified recipients.</p>
        <p>&copy; ${new Date().getFullYear()} EchoVault</p>
      </div>
    </div>
  </body>
  </html>
  `;
  
  // Plain text content for email
  const textContent = `
${isEmergency ? '⚠️ URGENT MESSAGE ⚠️\n\n' : ''}${textPriority}Secure Message from ${senderName}

Hello ${recipientName},

${senderName} has sent you a secure message: "${messageTitle}"

${securityDetails ? `SECURITY INFORMATION:\n${securityDetails}\n` : ''}

Access your secure message at:
${secureUrl}

This message was sent securely through EchoVault.
`;

  console.log(`Sending email to ${recipientEmail}`);

  try {
    // For emergency messages, try multiple email sending services
    // If one fails, try another (in this case we're just using resend but showing the pattern)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "EchoVault <notification@onwthrpgcnfydxzzmyot.resend.dev>", // Use verified sender domain
        to: [recipientEmail],
        subject: subject,
        html: htmlContent,
        text: textContent,
      })
    });

    const result = await response.json();

    if (response.status >= 400) {
      console.error("Error sending email:", result);
      throw new Error(result.message || "Error sending email");
    }

    console.log("Email sent successfully:", result);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send email:", error.message);
    throw error;
  }
}
