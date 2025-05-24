
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";

/**
 * Get active panic trigger conditions for a specific user
 * @param userId The user ID to get panic conditions for
 * @returns Array of panic conditions
 */
export async function getPanicConditions(userId: string) {
  const supabase = createSupabaseAdmin();
  
  // Get active panic trigger conditions for this specific user
  const { data: messages } = await supabase
    .from("messages")
    .select("id")
    .eq("user_id", userId);
    
  if (!messages || messages.length === 0) {
    console.log(`[PANIC] No messages found for user ${userId}`);
    return [];
  }
  
  const messageIds = messages.map(m => m.id);
  
  // Get active panic trigger conditions for messages owned by this user
  const { data: panicConditions } = await supabase
    .from("message_conditions")
    .select("id, message_id, panic_config, messages!inner(title)")
    .eq("condition_type", "panic_trigger")
    .eq("active", true)
    .in("message_id", messageIds);
  
  console.log(`[PANIC] Found ${panicConditions?.length || 0} active panic conditions for user ${userId}`);
  
  return panicConditions || [];
}

/**
 * Check if a message matches the SOS trigger keyword for any panic condition
 * @param messageBody Message content to check
 * @param panicConditions Array of panic conditions to check against
 * @returns Object with match status and matched message details
 */
export async function checkForPanicTrigger(messageBody: string, panicConditions: any[]) {
  const supabase = createSupabaseAdmin();
  const matches = [];
  
  for (const condition of panicConditions) {
    const config = condition.panic_config || {};
    const triggerKeyword = (config.trigger_keyword || "SOS").toLowerCase();
    const methods = config.methods || [];
    
    // Only check conditions that have WhatsApp enabled
    if (!methods.includes('whatsapp')) {
      continue;
    }
    
    if (messageBody.toLowerCase() === triggerKeyword) {
      console.log(`[PANIC] Match found! "${messageBody}" matches trigger "${triggerKeyword}" for message ${condition.message_id}`);
      matches.push({
        messageId: condition.message_id,
        conditionId: condition.id,
        config: config,
        title: condition.messages?.title || "Emergency message"
      });
    }
  }
  
  return matches;
}

/**
 * Trigger emergency message via the notification service
 * @param messageId Message ID to trigger
 * @param userId User ID triggering the message
 * @returns Result of the trigger operation
 */
async function triggerEmergencyMessage(messageId: string, userId: string) {
  const supabase = createSupabaseAdmin();
  
  console.log(`[PANIC] Triggering emergency message ${messageId} for user ${userId}`);
  
  try {
    // Call the send-message-notifications function to trigger the emergency
    const { data: triggerResult, error } = await supabase.functions.invoke("send-message-notifications", {
      body: {
        messageId: messageId,
        isEmergency: true,
        debug: true,
        forceSend: true,
        source: "whatsapp_sos_trigger",
        bypassDeduplication: true
      }
    });
    
    if (error) {
      console.error(`[PANIC] Error triggering emergency message: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`[PANIC] Emergency message triggered successfully: ${JSON.stringify(triggerResult)}`);
    return { success: true, data: triggerResult };
    
  } catch (error: any) {
    console.error(`[PANIC] Exception triggering emergency message: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send response message via WhatsApp
 * @param toNumber Phone number to send message to
 * @param message Message to send
 */
async function sendWhatsAppResponse(toNumber: string, message: string) {
  const supabase = createSupabaseAdmin();
  
  try {
    await supabase.functions.invoke("send-whatsapp-notification", {
      body: {
        to: toNumber,
        message: message
      }
    });
  } catch (error) {
    console.error(`[PANIC] Error sending WhatsApp response: ${error.message}`);
  }
}

/**
 * Process a panic trigger message from WhatsApp
 * @param userId The user ID that sent the message
 * @param fromNumber The phone number that sent the message
 * @param messageBody The content of the message
 * @returns Processing result
 */
export async function processPanicTrigger(userId: string, fromNumber: string, messageBody: string) {
  try {
    console.log(`[PANIC] Processing panic trigger for user ${userId} from phone ${fromNumber}, message: ${messageBody}`);
    
    // Get the panic conditions for this specific user
    const panicConditions = await getPanicConditions(userId);
    
    if (!panicConditions || panicConditions.length === 0) {
      console.log(`[PANIC] No active panic conditions found for user ${userId}`);
      
      await sendWhatsAppResponse(fromNumber, "❌ No active emergency messages found. Please set up an emergency message in the app first.");
      
      return { 
        status: "error", 
        message: "No active emergency messages found", 
        code: "NO_PANIC_CONDITIONS"
      };
    }
    
    // Check if the message matches any panic trigger
    const matches = await checkForPanicTrigger(messageBody, panicConditions);
    
    if (matches.length === 0) {
      console.log(`[PANIC] Message "${messageBody}" doesn't match any panic triggers`);
      
      await sendWhatsAppResponse(fromNumber, "❌ Emergency trigger not recognized. Make sure your emergency message is configured for WhatsApp with the correct keyword.");
      
      return { 
        status: "error", 
        message: "No matching emergency trigger found", 
        code: "NO_MATCH"
      };
    }
    
    // If we have matches, trigger them
    const results = [];
    let successCount = 0;
    
    for (const match of matches) {
      const triggerResult = await triggerEmergencyMessage(match.messageId, userId);
      results.push({
        messageId: match.messageId,
        title: match.title,
        result: triggerResult
      });
      
      if (triggerResult.success) {
        successCount++;
      }
    }
    
    if (successCount > 0) {
      const responseMessage = successCount === 1 ? 
        `⚠️ EMERGENCY ALERT TRIGGERED! Your emergency message "${matches[0].title}" has been sent to all recipients.` :
        `⚠️ EMERGENCY ALERTS TRIGGERED! ${successCount} emergency messages have been sent to all recipients.`;
        
      await sendWhatsAppResponse(fromNumber, responseMessage);
      
      console.log(`[PANIC] Successfully triggered ${successCount} emergency messages`);
      return { 
        status: "success", 
        message: `${successCount} emergency messages triggered`, 
        results: results,
        successCount: successCount
      };
    } else {
      await sendWhatsAppResponse(fromNumber, "❌ Failed to trigger emergency messages. Please try again or contact support.");
      
      console.log(`[PANIC] Failed to trigger any emergency messages`);
      return { 
        status: "error", 
        message: "Failed to trigger emergency messages", 
        code: "TRIGGER_FAILED",
        results: results
      };
    }
    
  } catch (error) {
    console.error(`[PANIC] Error in processPanicTrigger:`, error);
    
    await sendWhatsAppResponse(fromNumber, "❌ System error processing emergency request. Please try again.");
    
    return { 
      status: "error", 
      message: error.message || "Unknown error processing panic trigger",
      code: "PROCESSING_ERROR"
    };
  }
}
