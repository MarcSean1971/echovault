import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { handlePanicMessageSelection, processSelectionResponse } from "./panic-selection-service.ts";

/**
 * Get active panic trigger conditions for a specific user with message titles
 * @param userId The user ID to get panic conditions for
 * @returns Array of panic conditions with message titles
 */
export async function getPanicConditions(userId: string) {
  const supabase = createSupabaseAdmin();
  
  // Get active panic trigger conditions for this specific user with message titles
  const { data: panicConditions } = await supabase
    .from("message_conditions")
    .select(`
      id, 
      message_id, 
      panic_config,
      messages!inner(
        id,
        title,
        text_content,
        user_id
      )
    `)
    .eq("condition_type", "panic_trigger")
    .eq("active", true)
    .eq("messages.user_id", userId);
  
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
        message_id: condition.message_id,
        conditionId: condition.id,
        config: config,
        messages: condition.messages // Include the messages object for title access
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
    
    // First, check if this might be a selection response
    const selectionResult = await processSelectionResponse(userId, fromNumber, messageBody);
    
    if (selectionResult) {
      // This was a selection response
      if (selectionResult.status === "selected") {
        // User made a valid selection, trigger the selected message
        const triggerResult = await triggerEmergencyMessage(selectionResult.message_id, userId);
        
        if (triggerResult.success) {
          await sendWhatsAppResponse(fromNumber, `EMERGENCY TRIGGERED: ${selectionResult.selectedTitle}`);
          
          return {
            status: "success",
            message: `Emergency message "${selectionResult.selectedTitle}" triggered`,
            messageId: selectionResult.message_id
          };
        } else {
          await sendWhatsAppResponse(fromNumber, "Emergency trigger failed. Try again.");
          
          return {
            status: "error",
            message: "Failed to trigger selected emergency message",
            code: "TRIGGER_FAILED"
          };
        }
      } else {
        // Selection was cancelled or invalid
        return selectionResult;
      }
    }
    
    // Not a selection response, treat as new SOS trigger
    // Get the panic conditions for this specific user
    const panicConditions = await getPanicConditions(userId);
    
    if (!panicConditions || panicConditions.length === 0) {
      console.log(`[PANIC] No active panic conditions found for user ${userId}`);
      
      await sendWhatsAppResponse(fromNumber, "No emergency messages configured.");
      
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
      
      await sendWhatsAppResponse(fromNumber, "Emergency trigger not recognized.");
      
      return { 
        status: "error", 
        message: "No matching emergency trigger found", 
        code: "NO_MATCH"
      };
    }
    
    // If we have multiple matches, ask user to select
    if (matches.length > 1) {
      console.log(`[PANIC] Multiple panic messages found (${matches.length}), requesting user selection`);
      
      return await handlePanicMessageSelection(userId, fromNumber, matches);
    }
    
    // Single match, trigger it immediately
    const match = matches[0];
    const triggerResult = await triggerEmergencyMessage(match.message_id, userId);
    
    if (triggerResult.success) {
      const title = match.messages?.title || "Emergency Message";
      await sendWhatsAppResponse(fromNumber, `EMERGENCY TRIGGERED: ${title}`);
      
      console.log(`[PANIC] Successfully triggered emergency message: ${title}`);
      return { 
        status: "success", 
        message: `Emergency message "${title}" triggered`, 
        messageId: match.message_id
      };
    } else {
      await sendWhatsAppResponse(fromNumber, "Emergency trigger failed. Try again.");
      
      console.log(`[PANIC] Failed to trigger emergency message`);
      return { 
        status: "error", 
        message: "Failed to trigger emergency message", 
        code: "TRIGGER_FAILED",
        details: triggerResult
      };
    }
    
  } catch (error) {
    console.error(`[PANIC] Error in processPanicTrigger:`, error);
    
    await sendWhatsAppResponse(fromNumber, "System error. Try again.");
    
    return { 
      status: "error", 
      message: error.message || "Unknown error processing panic trigger",
      code: "PROCESSING_ERROR"
    };
  }
}
