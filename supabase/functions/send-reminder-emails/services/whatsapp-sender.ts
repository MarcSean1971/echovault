
import { supabaseClient } from "../supabase-client.ts";
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * WhatsApp sending service for check-in reminders with improved error handling
 */
export async function sendCheckInWhatsAppToCreator(
  whatsappNumber: string,
  messageTitle: string,
  messageId: string,
  hoursUntilDeadline: number
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const supabase = supabaseClient();
    const checkInUrl = generateCheckInUrl(messageId);
    
    const whatsappMessage = `🔔 *EchoVault Check-in Reminder*\n\nYour message "${messageTitle}" needs a check-in.\n\n⏰ Time until deadline: ${Math.max(0, hoursUntilDeadline).toFixed(1)} hours\n\n✅ Check in now: ${checkInUrl}`;
    
    console.log(`[WHATSAPP-SENDER] Attempting to send WhatsApp to ${whatsappNumber}`);
    
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: whatsappNumber,
        message: whatsappMessage,
        messageId: messageId,
        source: 'check-in-reminder'
      }
    });
    
    if (error) {
      throw new Error(`WhatsApp API error: ${error.message}`);
    }
    
    console.log(`[WHATSAPP-SENDER] WhatsApp API response:`, data);
    console.log(`[WHATSAPP-SENDER] Check-in WhatsApp sent successfully to ${whatsappNumber}`);
    return { success: true, messageId: data?.messageId };
    
  } catch (error: any) {
    console.error("[WHATSAPP-SENDER] WhatsApp sending error:", error);
    return {
      success: false,
      error: `WhatsApp sending failed: ${error.message}`
    };
  }
}
