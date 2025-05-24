
/**
 * Email service for sending reminder notifications
 */

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[EMAIL-SERVICE] Sending email to ${params.to}`);
    
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("[EMAIL-SERVICE] Missing RESEND_API_KEY");
      return { success: false, error: "Missing RESEND_API_KEY" };
    }
    
    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    
    const responseText = await response.text();
    console.log(`[EMAIL-SERVICE] Resend response: ${response.status} - ${responseText}`);
    
    if (!response.ok) {
      console.error(`[EMAIL-SERVICE] Email failed: ${response.status} - ${responseText}`);
      return { success: false, error: `Email API error: ${response.status}` };
    }
    
    console.log(`[EMAIL-SERVICE] Email sent successfully to ${params.to}`);
    return { success: true };
    
  } catch (error) {
    console.error("[EMAIL-SERVICE] Error sending email:", error);
    return { success: false, error: error.message || "Unknown email error" };
  }
}
