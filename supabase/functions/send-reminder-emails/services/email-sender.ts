
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * Email sending service for check-in reminders
 */
export async function sendCheckInEmailToCreator(
  creatorEmail: string,
  creatorFirstName: string,
  messageTitle: string,
  messageId: string,
  hoursUntilDeadline: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const checkInUrl = generateCheckInUrl(messageId);
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🔔 Check-in Reminder</h2>
        <p>Hi ${creatorFirstName || 'User'},</p>
        <p>Your message "<strong>${messageTitle}</strong>" needs a check-in.</p>
        <p><strong>Time until deadline:</strong> ${Math.max(0, hoursUntilDeadline).toFixed(1)} hours</p>
        <div style="margin: 20px 0;">
          <a href="${checkInUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">✅ Check In Now</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you don't check in before the deadline, your message will be delivered to recipients.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">This is an automated reminder from EchoVault.</p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EchoVault <noreply@resend.dev>",
        to: [creatorEmail],
        subject: `🔔 Check-in Required: ${messageTitle}`,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email API error: ${errorText}`);
    }

    console.log(`[EMAIL-SENDER] Check-in email sent successfully to ${creatorEmail}`);
    return { success: true };
    
  } catch (error: any) {
    console.error("[EMAIL-SENDER] Email sending error:", error);
    return { 
      success: false, 
      error: `Email sending failed: ${error.message}` 
    };
  }
}
