
import { supabaseClient } from "../supabase-client.ts";
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * ENHANCED WhatsApp sending service with improved error handling and retry logic
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
    
    // Format time display
    const timeDisplay = hoursUntilDeadline > 1 
      ? `${hoursUntilDeadline.toFixed(1)} hours`
      : hoursUntilDeadline > 0 
        ? `${Math.ceil(hoursUntilDeadline * 60)} minutes`
        : 'less than 1 minute';
    
    const whatsappMessage = `🔔 *EchoVault Check-in Reminder*\n\nYour message "${messageTitle}" needs a check-in.\n\n⏰ Time until deadline: ${timeDisplay}\n\n✅ Check in now: ${checkInUrl}\n\nIf you don't check in, your message will be delivered automatically.`;
    
    console.log(`[WHATSAPP-SENDER] Attempting to send check-in WhatsApp to ${whatsappNumber}`);
    console.log(`[WHATSAPP-SENDER] Message preview: ${whatsappMessage.substring(0, 100)}...`);
    
    // ENHANCED: Retry logic with better error handling
    let lastError = null;
    let attempt = 0;
    const maxAttempts = 2;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            to: whatsappNumber,
            message: whatsappMessage,
            messageId: messageId,
            source: 'check-in-reminder',
            attempt: attempt
          }
        });
        
        if (error) {
          lastError = error;
          console.warn(`[WHATSAPP-SENDER] Attempt ${attempt} failed:`, error);
          
          if (attempt < maxAttempts) {
            console.log(`[WHATSAPP-SENDER] Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        } else {
          console.log(`[WHATSAPP-SENDER] WhatsApp API response on attempt ${attempt}:`, data);
          console.log(`[WHATSAPP-SENDER] Check-in WhatsApp sent successfully to ${whatsappNumber}`);
          return { success: true, messageId: data?.messageId || `attempt-${attempt}` };
        }
      } catch (attemptError: any) {
        lastError = attemptError;
        console.error(`[WHATSAPP-SENDER] Attempt ${attempt} exception:`, attemptError);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // All attempts failed
    throw new Error(`All ${maxAttempts} WhatsApp attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
    
  } catch (error: any) {
    console.error("[WHATSAPP-SENDER] WhatsApp sending error:", error);
    return {
      success: false,
      error: `WhatsApp sending failed: ${error.message}`
    };
  }
}

/**
 * Enhanced WhatsApp URL generator
 */
function generateCheckInUrl(messageId: string): string {
  return `https://echo-vault.app/messages?checkin=${messageId}`;
}
