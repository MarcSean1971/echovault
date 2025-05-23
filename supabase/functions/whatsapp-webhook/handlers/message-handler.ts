
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { processCheckIn } from "../services/check-in-service.ts";
import { findUserByPhone } from "../services/user-service.ts";
import { processPanicTrigger } from "../services/panic-service.ts";

/**
 * Process incoming WhatsApp messages
 * @param fromNumber Phone number that sent the message
 * @param messageBody Content of the message
 * @returns Processing result
 */
export async function processWhatsAppMessage(fromNumber: string, messageBody: string) {
  try {
    console.log(`[WEBHOOK] Processing message from ${fromNumber}: ${messageBody}`);
    
    // Clean up inputs
    const cleanedNumber = fromNumber.replace(/\s+/g, "").trim();
    const cleanedMessage = messageBody.trim();
    
    // Get the user associated with this phone number
    const userId = await findUserByPhone(cleanedNumber);
    
    if (!userId) {
      console.log(`[WEBHOOK] No user found for phone number ${cleanedNumber}`);
      return { 
        status: "error", 
        message: "Unknown user",
        code: "USER_NOT_FOUND"
      };
    }
    
    console.log(`[WEBHOOK] Found user ${userId} for phone number ${cleanedNumber}`);
    
    // Check if this is a check-in message
    if (cleanedMessage.toLowerCase() === "checkin" || 
        cleanedMessage.toLowerCase() === "check-in" || 
        cleanedMessage.toLowerCase() === "check in") {
      console.log(`[WEBHOOK] Processing check-in for user ${userId}`);
      return await processCheckIn(userId, cleanedNumber);
    }
    
    // Check if this is a check-in code
    if (cleanedMessage.length >= 4 && 
        cleanedMessage.length <= 10 && 
        /^[a-zA-Z0-9]+$/.test(cleanedMessage)) {
      console.log(`[WEBHOOK] Processing potential check-in code: ${cleanedMessage}`);
      return await processCheckIn(userId, cleanedNumber);
    }
    
    // Check if this is a panic trigger message (SOS or custom keyword)
    // Or if this is a message selection for multiple panic messages
    if (cleanedMessage.toLowerCase() === "sos" || 
        cleanedMessage.toLowerCase() === "help" || 
        cleanedMessage.toLowerCase() === "emergency" ||
        cleanedMessage.toLowerCase() === "all" || 
        /^[1-9][0-9]*$/.test(cleanedMessage)) {
      console.log(`[WEBHOOK] Processing panic trigger or selection for user ${userId}`);
      return await processPanicTrigger(userId, cleanedNumber, cleanedMessage);
    }
    
    // Unknown command
    console.log(`[WEBHOOK] Unknown command: ${cleanedMessage}`);
    return { 
      status: "error", 
      message: "Unknown command. Available commands: CHECKIN, SOS", 
      code: "UNKNOWN_COMMAND"
    };
    
  } catch (error) {
    console.error(`[WEBHOOK] Error processing message:`, error);
    return { 
      status: "error", 
      message: error.message || "Error processing message",
      code: "PROCESSING_ERROR" 
    };
  }
}
