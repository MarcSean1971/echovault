
import { supabaseClient } from "../supabase-client.ts";
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * WhatsApp sending service for check-in reminders
 */
export async function sendCheckInWhatsAppToCreator(
  whatsappNumber: string,
  messageTitle: string,
  messageId: string,
  hoursUntilDeadline: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseClient();
    const checkInUrl = generateCheckInUrl(messageId);
    
    const whatsappMessage = `🔔 *EchoVault Check-in Reminder*\n\nYour message "${messageTitle}" needs a check-in.\n\n⏰ Time until deadline: ${Math.max(0, hoursUntilDeadline).toFixed(1)} hours\n\n✅ Check in now: ${checkInUrl}`;
    
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: whatsappNumber,
        message: whatsappMessage,
        messageId: messageId,
        source: 'check-in-reminder'
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log(`[WHATSAPP-SENDER] Check-in WhatsApp sent successfully to ${whatsappNumber}`);
    return { success: true };
    
  } catch (error: any) {
    console.error("[WHATSAPP-SENDER] WhatsApp sending error:", error);
    return {
      success: false,
      error: `WhatsApp sending failed: ${error.message}`
    };
  }
}
