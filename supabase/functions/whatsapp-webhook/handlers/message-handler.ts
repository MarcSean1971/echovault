
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { findUserByPhone } from "../services/user-service.ts";
import { processCheckIn } from "../services/check-in-service.ts";
import { getPanicConditions, checkForPanicTrigger, sendPanicResponseMessage } from "../services/panic-service.ts";

/**
 * Process incoming WhatsApp message based on content
 * @param fromNumber Number that sent the message
 * @param messageBody Content of the message
 * @returns Response object with processing result
 */
export async function processWhatsAppMessage(fromNumber: string, messageBody: string) {
  // Step 1: Find the user by their phone number
  const userId = await findUserByPhone(fromNumber);
  
  if (!userId) {
    const supabase = createSupabaseAdmin();
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: fromNumber,
        message: "Sorry, we couldn't identify your account. Please make sure your WhatsApp number is registered in the system."
      }
    });
    
    return {
      success: false,
      message: "No user found with this phone number"
    };
  }
  
  // Step 2: Process the message based on its content
  
  // Check if it's a check-in request
  if (messageBody.toUpperCase() === "CHECKIN" || 
      messageBody.toUpperCase() === "CHECK-IN" || 
      messageBody.toUpperCase() === "CODE") {
    
    const checkInResult = await processCheckIn(userId, fromNumber);
    
    return {
      type: "check-in",
      userId,
      result: checkInResult
    };
  }
  
  // Handle potential panic trigger
  console.log(`[WEBHOOK] Checking if "${messageBody}" is a panic trigger`);
  
  // Get active panic trigger conditions for this user
  const panicConditions = await getPanicConditions();
  
  // Exit early if no conditions found
  if (!panicConditions || panicConditions.length === 0) {
    const supabase = createSupabaseAdmin();
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: fromNumber,
        message: "No active panic messages configured. To trigger an emergency message, set up a panic trigger in the app."
      }
    });
    
    return {
      type: "no_panic_conditions",
      userId
    };
  }
  
  // Check if message matches any trigger keywords
  const triggerResult = await checkForPanicTrigger(messageBody, panicConditions);
  
  // Send appropriate response message
  await sendPanicResponseMessage(fromNumber, triggerResult.matched, "SOS");
  
  if (!triggerResult.matched) {
    return {
      type: "no_match",
      userId
    };
  }
  
  return {
    type: "panic_trigger",
    userId,
    matched: true,
    messageId: triggerResult.messageId
  };
}
