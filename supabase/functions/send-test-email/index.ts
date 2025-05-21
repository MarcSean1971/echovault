
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  messageTitle: string;
  appName?: string;
  isWelcomeEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body safely
    let requestBody: EmailRequest;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error("Invalid request body format. Expected JSON.");
    }

    const { 
      recipientName, 
      recipientEmail, 
      senderName, 
      messageTitle, 
      appName = "EchoVault",
      isWelcomeEmail = false
    } = requestBody;

    if (!recipientEmail || !senderName || !messageTitle) {
      throw new Error("Missing required parameters: recipientEmail, senderName, and messageTitle are required");
    }

    console.log(`Sending ${isWelcomeEmail ? 'welcome' : 'test'} email to ${recipientEmail}`);
    
    // Choose the appropriate email template based on the request type
    const htmlContent = isWelcomeEmail 
      ? generateWelcomeEmail(recipientName, appName, senderName, messageTitle)
      : generateTestEmail(recipientName, senderName, messageTitle, appName);

    const emailSubject = isWelcomeEmail
      ? `Welcome to ${appName} - You've been added as a recipient`
      : `You've been added as a recipient for a secure message`;
    
    const emailResponse = await resend.emails.send({
      from: `${appName} <notifications@echo-vault.app>`,
      to: [recipientEmail],
      subject: emailSubject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
    
    // More detailed error message
    const errorMessage = error.message || "Unknown error";
    const errorDetails = {
      success: false, 
      error: errorMessage,
      details: error.statusCode === 403 ? 
        "Resend requires domain verification. You may only send to your own verified email during testing." : 
        error.toString()
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateTestEmail(recipientName: string, senderName: string, messageTitle: string, appName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #9b87f5; margin-top: 0;">${appName}</h1>
        <p style="font-size: 16px; margin-bottom: 0;">Secure message notification</p>
      </div>
      
      <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Hello ${recipientName || "there"},</h2>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        This is a <strong>test notification</strong> to inform you that <strong>${senderName}</strong> has added you as a recipient for a secure message titled "<strong>${messageTitle}</strong>".
      </p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #9b87f5; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-style: italic;">
          <strong>What is EchoVault?</strong> It's a security mechanism that activates when specific conditions are met, ensuring important information reaches specified recipients only when needed.
        </p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        The actual message content remains secure and private. You will only receive the full message if certain conditions set by the sender are met.
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
        No action is required from you at this time. This is just a notification that you have been included as a recipient.
      </p>
      
      <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; font-size: 14px; color: #666;">
        <p>This is a test message for verification purposes only.</p>
        <p>For questions about this service, please contact the sender directly.</p>
        <p style="margin-bottom: 0;">© ${new Date().getFullYear()} ${appName} Service</p>
      </div>
    </div>
  `;
}

function generateWelcomeEmail(recipientName: string, appName: string, senderName: string, messageTitle: string): string {
  const signupUrl = "https://echo-vault.app/register"; // Replace with actual signup URL
  
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #9b87f5; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin-top: 0; font-size: 28px;">Welcome to ${appName}</h1>
        <p style="font-size: 18px; margin-bottom: 0; color: #ffffff;">You've been added as a recipient</p>
      </div>
      
      <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Hello ${recipientName || "there"},</h2>
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        <strong>${senderName}</strong> has added you as a recipient for the secure message "<strong>${messageTitle}</strong>" with ${appName}.
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
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
        <strong>No action is required</strong> from you at this time. If and when a condition is met, you'll receive the secure message automatically.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${signupUrl}" style="background-color: #9b87f5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Create Your Own EchoVault Account</a>
        <p style="margin-top: 15px; color: #666; font-size: 14px;">
          Want to create your own secure messages? Sign up for ${appName} today!
        </p>
      </div>
      
      <div style="border-top: 1px solid #e5e5e5; padding-top: 25px; font-size: 14px; color: #666; text-align: center;">
        <p>If you have any questions, please contact ${senderName} who added you as a recipient.</p>
        <p>© ${new Date().getFullYear()} ${appName} • Secure Time-Sensitive Messaging</p>
      </div>
    </div>
  `;
}

serve(handler);
