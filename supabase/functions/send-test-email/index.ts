
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SEND TEST EMAIL FUNCTION ===");
    
    const body = await req.json().catch(() => ({}));
    const debug = body.debug || false;
    
    if (debug) {
      console.log("DEBUG MODE: Testing email service configuration");
    }
    
    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    console.log("✅ RESEND_API_KEY is configured");
    
    // Import Resend
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    // Test email configuration
    const testEmail = "test@echo-vault.app"; // Use your verified domain
    const testSubject = "🧪 EchoVault Email Service Test";
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #9b87f5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success { color: #22c55e; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Email Service Test</h1>
          </div>
          <div class="content">
            <p class="success">✅ SUCCESS: Email service is working correctly!</p>
            <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Service:</strong> Resend via EchoVault</p>
            <p><strong>Purpose:</strong> Critical reminder system verification</p>
            
            <h3>System Status:</h3>
            <ul>
              <li>✅ RESEND_API_KEY configured</li>
              <li>✅ Email delivery functional</li>
              <li>✅ HTML rendering working</li>
              <li>✅ Critical reminder system operational</li>
            </ul>
            
            <p><em>This test confirms that your deadman's switch reminder emails will be delivered successfully.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    console.log("🚀 Sending test email...");
    
    // Send the test email
    const emailResult = await resend.emails.send({
      from: "EchoVault Test <notifications@echo-vault.app>",
      to: [testEmail],
      subject: testSubject,
      html: testHtml,
    });
    
    if (emailResult.error) {
      console.error("❌ Email send error:", emailResult.error);
      throw new Error(`Email send failed: ${emailResult.error.message}`);
    }
    
    console.log("✅ Test email sent successfully:", emailResult.data?.id);
    
    const response = {
      success: true,
      message: "Email service test successful",
      emailId: emailResult.data?.id,
      timestamp: new Date().toISOString(),
      service: "resend",
      status: "operational"
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
    
  } catch (error: any) {
    console.error("❌ Email service test failed:", error);
    
    const errorResponse = {
      success: false,
      message: "Email service test failed",
      error: error.message,
      timestamp: new Date().toISOString(),
      service: "resend",
      status: "failed"
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
});
