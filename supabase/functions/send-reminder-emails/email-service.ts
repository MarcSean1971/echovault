
/**
 * FIXED: Enhanced email service with proper error handling and validation
 */

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log(`[EMAIL-SERVICE] Attempting to send email to ${params.to}`);
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.to)) {
      console.error(`[EMAIL-SERVICE] Invalid email format: ${params.to}`);
      return { success: false, error: "Invalid email format" };
    }
    
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("[EMAIL-SERVICE] Missing RESEND_API_KEY environment variable");
      return { success: false, error: "Missing RESEND_API_KEY configuration" };
    }
    
    // FIXED: Ensure we use the correct verified domain
    const fromEmail = params.from.includes("@echo-vault.app") 
      ? params.from 
      : "EchoVault <notifications@echo-vault.app>";
    
    // Prepare email payload with validation
    const emailPayload = {
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    };
    
    console.log(`[EMAIL-SERVICE] Sending email with payload:`, {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailPayload.html.length
    });
    
    // Send email using Resend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      console.log(`[EMAIL-SERVICE] Resend API response: ${response.status} - ${responseText}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn("[EMAIL-SERVICE] Could not parse error response:", parseError);
        }
        
        console.error(`[EMAIL-SERVICE] Email sending failed: ${errorMessage}`);
        return { success: false, error: `Email API error: ${errorMessage}` };
      }
      
      // Parse successful response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("[EMAIL-SERVICE] Could not parse success response:", parseError);
        responseData = { id: 'unknown' };
      }
      
      console.log(`[EMAIL-SERVICE] Email sent successfully to ${params.to}, message ID: ${responseData.id}`);
      return { 
        success: true, 
        messageId: responseData.id 
      };
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("[EMAIL-SERVICE] Email sending timed out after 30 seconds");
        return { success: false, error: "Email sending timeout" };
      }
      
      console.error("[EMAIL-SERVICE] Network error sending email:", fetchError);
      return { success: false, error: `Network error: ${fetchError.message}` };
    }
    
  } catch (error: any) {
    console.error("[EMAIL-SERVICE] Unexpected error in sendEmail:", error);
    return { success: false, error: `Unexpected error: ${error.message || 'Unknown error'}` };
  }
}
