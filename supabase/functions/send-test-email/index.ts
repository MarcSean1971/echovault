
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  messageTitle: string;
  appName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body safely
    let requestBody: TestEmailRequest;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error("Invalid request body format. Expected JSON.");
    }

    const { recipientName, recipientEmail, senderName, messageTitle, appName = "EchoVault" } = requestBody;

    if (!recipientEmail || !senderName || !messageTitle) {
      throw new Error("Missing required parameters: recipientEmail, senderName, and messageTitle are required");
    }

    console.log(`Sending test email to ${recipientEmail}`);
    
    const emailResponse = await resend.emails.send({
      from: `${appName} <notifications@echo-vault.app>`,
      to: [recipientEmail],
      subject: `You've been added as a recipient for a secure message`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">${appName}</h1>
            <p style="font-size: 16px; margin-bottom: 0;">Secure message notification</p>
          </div>
          
          <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Hello ${recipientName || "there"},</h2>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            This is a <strong>test notification</strong> to inform you that <strong>${senderName}</strong> has added you as a recipient for a secure message titled "<strong>${messageTitle}</strong>".
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
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
      `,
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

serve(handler);
