
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";

/**
 * Get active panic trigger conditions for a user
 * @returns Array of panic conditions
 */
export async function getPanicConditions() {
  const supabase = createSupabaseAdmin();
  
  // Get active panic trigger conditions
  const { data: panicConditions } = await supabase
    .from("message_conditions")
    .select("id, message_id, panic_config")
    .eq("condition_type", "panic_trigger")
    .eq("active", true);
  
  console.log(`[WEBHOOK] Found ${panicConditions?.length || 0} active panic conditions`);
  
  return panicConditions || [];
}

/**
 * Check if a message matches any panic trigger keyword
 * @param messageBody Message content to check
 * @param panicConditions Array of panic conditions to check against
 * @returns Object with match status and matched message ID
 */
export async function checkForPanicTrigger(messageBody: string, panicConditions: any[]) {
  const supabase = createSupabaseAdmin();
  
  for (const condition of panicConditions) {
    const config = condition.panic_config || {};
    const triggerKeyword = (config.trigger_keyword || "SOS").toLowerCase();
    
    if (messageBody.toLowerCase() === triggerKeyword) {
      console.log(`[WEBHOOK] Match found! "${messageBody}" matches trigger "${triggerKeyword}"`);
      
      // Trigger the emergency message
      const { data: triggerResult } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: condition.message_id,
          isEmergency: true,
          debug: true
        }
      });
      
      return {
        matched: true,
        messageId: condition.message_id,
        triggerResult
      };
    }
  }
  
  return { matched: false };
}

/**
 * Send confirmation or help message via WhatsApp
 * @param toNumber Phone number to send message to
 * @param matched Whether a panic trigger match was found
 * @param defaultTrigger Default trigger keyword to suggest
 */
export async function sendPanicResponseMessage(toNumber: string, matched: boolean, defaultTrigger = "SOS") {
  const supabase = createSupabaseAdmin();
  
  if (matched) {
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: toNumber,
        message: "⚠️ EMERGENCY ALERT TRIGGERED. Your emergency messages have been sent to all recipients."
      }
    });
  } else {
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: toNumber,
        message: `No matching emergency trigger found. Please send '${defaultTrigger}' to trigger your emergency message.`
      }
    });
  }
}
