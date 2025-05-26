

import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * Email sending service for check-in reminders with improved design
 */
export async function sendCheckInEmailToCreator(
  creatorEmail: string,
  creatorFirstName: string,
  messageTitle: string,
  messageId: string,
  hoursUntilDeadline: number
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const checkInUrl = generateCheckInUrl(messageId);
    
    // Modern email design matching app's color scheme
    const emailContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-in Reminder</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #1e293b;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin-top: 20px;
            margin-bottom: 20px;
          }
          
          .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            padding: 32px 24px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .logo {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 8px 0;
            position: relative;
            z-index: 1;
          }
          
          .subtitle {
            color: #e2e8f0;
            font-size: 16px;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 40px 32px;
          }
          
          .alert-badge {
            display: inline-flex;
            align-items: center;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            border: 1px solid #f59e0b;
          }
          
          .alert-icon {
            margin-right: 8px;
            font-size: 16px;
          }
          
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 16px 0;
          }
          
          .message-title {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
          }
          
          .message-title-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .message-title-text {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }
          
          .countdown {
            text-align: center;
            margin: 32px 0;
            padding: 24px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-radius: 12px;
            border: 1px solid #fecaca;
          }
          
          .countdown-label {
            font-size: 14px;
            color: #991b1b;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .countdown-time {
            font-size: 32px;
            font-weight: 700;
            color: #dc2626;
            font-family: 'Space Grotesk', sans-serif;
          }
          
          .countdown-unit {
            font-size: 14px;
            color: #991b1b;
            font-weight: 500;
          }
          
          .cta-container {
            text-align: center;
            margin: 32px 0;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
          }
          
          .info-text {
            color: #64748b;
            font-size: 14px;
            text-align: center;
            margin: 24px 0;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .footer {
            background: #f8fafc;
            padding: 24px 32px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          
          .footer-text {
            color: #64748b;
            font-size: 12px;
            margin: 0;
          }
          
          .footer-brand {
            color: #8b5cf6;
            font-weight: 600;
            text-decoration: none;
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 12px;
            }
            
            .content {
              padding: 24px 20px;
            }
            
            .header {
              padding: 24px 20px;
            }
            
            .countdown-time {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">EchoVault</h1>
            <p class="subtitle">Secure Message Delivery System</p>
          </div>
          
          <div class="content">
            <div class="alert-badge">
              <span class="alert-icon">🔔</span>
              Check-in Required
            </div>
            
            <h2 class="greeting">Hi ${creatorFirstName},</h2>
            
            <p>Your secured message requires a check-in to prevent automatic delivery to recipients.</p>
            
            <div class="message-title">
              <div class="message-title-label">Message Title</div>
              <h3 class="message-title-text">${messageTitle}</h3>
            </div>
            
            <div class="countdown">
              <div class="countdown-label">Time Until Deadline</div>
              <div class="countdown-time">
                ${Math.max(0, hoursUntilDeadline).toFixed(1)}
                <span class="countdown-unit">hours</span>
              </div>
            </div>
            
            <div class="cta-container">
              <a href="${checkInUrl}" class="cta-button">
                ✅ Check In Now
              </a>
            </div>
            
            <div class="info-text">
              <strong>Important:</strong> If you don't check in before the deadline, your message will be automatically delivered to all recipients. This action cannot be undone.
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This is an automated reminder from 
              <a href="#" class="footer-brand">EchoVault</a>
              <br>
              Secure. Private. Reliable.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`[EMAIL-SENDER] Attempting to send email to ${creatorEmail} using Resend API`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EchoVault <notifications@echo-vault.app>",
        to: [creatorEmail],
        subject: `🔔 Check-in Required: ${messageTitle}`,
        html: emailContent,
      }),
    });

    const responseText = await emailResponse.text();
    console.log(`[EMAIL-SENDER] Resend API response status: ${emailResponse.status}, body: ${responseText}`);

    if (!emailResponse.ok) {
      throw new Error(`Email API error (${emailResponse.status}): ${responseText}`);
    }

    const responseData = JSON.parse(responseText);
    const emailMessageId = responseData.id;

    console.log(`[EMAIL-SENDER] Check-in email sent successfully to ${creatorEmail}, messageId: ${emailMessageId}`);
    return { success: true, messageId: emailMessageId };
    
  } catch (error: any) {
    console.error("[EMAIL-SENDER] Email sending error:", error);
    return { 
      success: false, 
      error: `Email sending failed: ${error.message}` 
    };
  }
}

