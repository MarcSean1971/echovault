
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetEmailRequest = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your EchoVault Password</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #9b87f5 0%, #7c3aed 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              color: #ffffff;
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .tagline {
              color: rgba(255, 255, 255, 0.9);
              font-size: 14px;
              margin: 8px 0 0 0;
            }
            .content {
              padding: 40px 30px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1e293b;
              margin: 0 0 20px 0;
              text-align: center;
            }
            .message {
              font-size: 16px;
              color: #64748b;
              margin: 0 0 30px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #9b87f5 0%, #7c3aed 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              margin: 20px 0;
              width: 100%;
              box-sizing: border-box;
            }
            .button:hover {
              opacity: 0.9;
            }
            .security-notice {
              background-color: #f1f5f9;
              border-left: 4px solid #9b87f5;
              padding: 16px;
              margin: 30px 0;
              border-radius: 0 8px 8px 0;
            }
            .security-notice h4 {
              margin: 0 0 8px 0;
              color: #1e293b;
              font-size: 16px;
              font-weight: 600;
            }
            .security-notice p {
              margin: 0;
              color: #64748b;
              font-size: 14px;
            }
            .footer {
              background-color: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 0;
              color: #94a3b8;
              font-size: 14px;
            }
            .footer a {
              color: #9b87f5;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">EchoVault</h1>
              <p class="tagline">Your secure digital failsafe</p>
            </div>
            
            <div class="content">
              <h2 class="title">Reset Your Password</h2>
              <p class="message">
                We received a request to reset the password for your EchoVault account. 
                Click the button below to create a new password.
              </p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset My Password</a>
              </div>
              
              <div class="security-notice">
                <h4>🔒 Security Notice</h4>
                <p>This password reset link will expire in 24 hours for your security. If you didn't request this reset, you can safely ignore this email.</p>
              </div>
              
              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #9b87f5; word-break: break-all;">${resetLink}</a>
              </p>
            </div>
            
            <div class="footer">
              <p>
                This email was sent by EchoVault<br>
                If you have any questions, please contact our support team.
              </p>
              <p style="margin-top: 16px;">
                <a href="${Deno.env.get('APP_DOMAIN') || 'https://echo-vault.app'}">Visit EchoVault</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "EchoVault <noreply@echo-vault.app>",
      to: [email],
      subject: "Reset Your EchoVault Password",
      html: emailHtml,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
