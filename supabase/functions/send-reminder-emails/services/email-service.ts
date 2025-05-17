
import { Resend } from "npm:resend@2.0.0";

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!resend) {
      console.error("Resend initialization failed: API key may be missing");
      return false;
    }
    
    console.log(`Sending email to ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    
    const { data, error } = await resend.emails.send({
      from: emailData.from || "EchoVault <notifications@echvault.lovable.ai>",
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
    });
    
    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }
    
    console.log("Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
