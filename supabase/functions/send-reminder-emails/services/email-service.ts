
/**
 * Email service for sending notifications
 * UPDATED: Simplified to match the main email template
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from: string;
  text?: string;
}

/**
 * Send an email using the configured email service
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if we're in debug mode (no actual emails sent)
    const debugMode = Deno.env.get("DEBUG_MODE") === "true";
    if (debugMode) {
      console.log(`[DEBUG] Would send email to ${options.to} with subject "${options.subject}"`);
      return true;
    }
  
    // Get the API key for the email service
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("No RESEND_API_KEY found in environment variables");
      return false;
    }
    
    // Prepare the email payload
    const payload = {
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || null
    };
    
    // Send the email using the Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error("Error sending email:", result);
      return false;
    }
    
    console.log("Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return false;
  }
}
