
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { getPanicConditions, checkForPanicTrigger, sendPanicResponseMessage } from "./panic-service.ts";

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

/**
 * Process a panic trigger message from WhatsApp
 * @param userId The user ID that sent the message
 * @param fromNumber The phone number that sent the message
 * @returns Processing result
 */
export async function processPanicTrigger(userId: string, fromNumber: string) {
  try {
    console.log(`[WEBHOOK] Processing panic trigger for user ${userId} from phone ${fromNumber}`);
    
    // Get the panic conditions for this user
    const panicConditions = await getPanicConditions();
    
    if (!panicConditions || panicConditions.length === 0) {
      console.log(`[WEBHOOK] No active panic conditions found`);
      return { 
        status: "error", 
        message: "No active emergency messages found", 
        code: "NO_PANIC_CONDITIONS"
      };
    }
    
    // Check if the message matches any panic trigger
    const triggerResult = await checkForPanicTrigger("SOS", panicConditions);
    
    // Send response message
    await sendPanicResponseMessage(fromNumber, triggerResult.matched, "SOS");
    
    if (triggerResult.matched) {
      console.log(`[WEBHOOK] Successfully triggered panic message ${triggerResult.messageId}`);
      return { 
        status: "success", 
        message: "Emergency message triggered", 
        messageId: triggerResult.messageId 
      };
    } else {
      console.log(`[WEBHOOK] No matching panic message found`);
      return { 
        status: "error", 
        message: "No matching emergency trigger found", 
        code: "NO_MATCH"
      };
    }
    
  } catch (error) {
    console.error(`[WEBHOOK] Error in processPanicTrigger:`, error);
    return { 
      status: "error", 
      message: error.message || "Unknown error processing panic trigger",
      code: "PROCESSING_ERROR"
    };
  }
}
