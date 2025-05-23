
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
    console.log(`[WEBHOOK] No messages found for user ${userId}`);
    return [];
  }
  
  const messageIds = messages.map(m => m.id);
  
  // Get active panic trigger conditions for messages owned by this user
  const { data: panicConditions } = await supabase
    .from("message_conditions")
    .select("id, message_id, panic_config, message:message_id(title)")
    .eq("condition_type", "panic_trigger")
    .eq("active", true)
    .in("message_id", messageIds);
  
  console.log(`[WEBHOOK] Found ${panicConditions?.length || 0} active panic conditions for user ${userId}`);
  
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
  const matches = [];
  
  for (const condition of panicConditions) {
    const config = condition.panic_config || {};
    const triggerKeyword = (config.trigger_keyword || "SOS").toLowerCase();
    
    if (messageBody.toLowerCase() === triggerKeyword) {
      console.log(`[WEBHOOK] Match found! "${messageBody}" matches trigger "${triggerKeyword}" for message ${condition.message_id}`);
      matches.push({
        messageId: condition.message_id,
        config: config,
        title: condition.message?.title || "Emergency message"
      });
    }
  }
  
  // If no matches found
  if (matches.length === 0) {
    return { matched: false };
  }
  
  // If only one match found, trigger it
  if (matches.length === 1) {
    const { messageId, config } = matches[0];
    
    // Trigger the emergency message
    const { data: triggerResult } = await supabase.functions.invoke("send-message-notifications", {
      body: {
        messageId: messageId,
        isEmergency: true,
        debug: true,
        whatsAppEnabled: config.methods?.includes('whatsapp') || false
      }
    });
    
    return {
      matched: true,
      messageId,
      triggerResult,
      isMultiple: false
    };
  }
  
  // If multiple matches found, return them so user can choose
  return {
    matched: true,
    isMultiple: true,
    matchCount: matches.length,
    matches: matches.map(m => ({
      id: m.messageId,
      title: m.title
    }))
  };
}

/**
 * Send confirmation or help message via WhatsApp
 * @param toNumber Phone number to send message to
 * @param matched Whether a panic trigger match was found
 * @param defaultTrigger Default trigger keyword to suggest
 */
export async function sendPanicResponseMessage(toNumber: string, matched: boolean, defaultTrigger = "SOS", multipleMessages = false, matches = []) {
  const supabase = createSupabaseAdmin();
  
  if (matched && multipleMessages) {
    // Create a numbered list of available emergency messages
    const messageList = matches.map((match, index) => 
      `${index + 1}. ${match.title || `Emergency message ${index + 1}`}`
    ).join("\n");
    
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: toNumber,
        message: `⚠️ MULTIPLE EMERGENCY MESSAGES FOUND. Reply with the number of the message you want to trigger:\n\n${messageList}\n\nOr reply with ALL to trigger all messages.`
      }
    });
  } else if (matched) {
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
 * @param messageBody The content of the message
 * @returns Processing result
 */
export async function processPanicTrigger(userId: string, fromNumber: string, messageBody: string) {
  try {
    console.log(`[WEBHOOK] Processing panic trigger for user ${userId} from phone ${fromNumber}, message: ${messageBody}`);
    
    // Get the panic conditions for this specific user
    const panicConditions = await getPanicConditions(userId);
    
    if (!panicConditions || panicConditions.length === 0) {
      console.log(`[WEBHOOK] No active panic conditions found for user ${userId}`);
      
      // Send response message
      await sendPanicResponseMessage(fromNumber, false, "SOS");
      
      return { 
        status: "error", 
        message: "No active emergency messages found", 
        code: "NO_PANIC_CONDITIONS"
      };
    }
    
    // Check if the message is a message selection (number or "ALL")
    if (panicConditions.length > 1 && (messageBody.toLowerCase() === "all" || /^[1-9][0-9]*$/.test(messageBody))) {
      return await handleMessageSelection(userId, fromNumber, messageBody, panicConditions);
    }
    
    // Check if the message matches any panic trigger
    const triggerResult = await checkForPanicTrigger(messageBody, panicConditions);
    
    // Multiple messages found, ask user to select
    if (triggerResult.matched && triggerResult.isMultiple) {
      console.log(`[WEBHOOK] Multiple matching panic messages found (${triggerResult.matchCount})`);
      
      // Format the message titles to show to the user
      const messageMatches = triggerResult.matches;
      
      // Send selection message with actual message titles
      await sendPanicResponseMessage(fromNumber, true, "SOS", true, messageMatches);
      
      return { 
        status: "pending", 
        message: "Multiple emergency messages found, selection required", 
        matchCount: triggerResult.matchCount,
        matches: messageMatches.map(m => m.id)
      };
    }
    
    // Send response message for single match or no match
    await sendPanicResponseMessage(fromNumber, triggerResult.matched, "SOS");
    
    if (triggerResult.matched) {
      console.log(`[WEBHOOK] Successfully triggered panic message ${triggerResult.messageId}`);
      return { 
        status: "success", 
        message: "Emergency message triggered", 
        messageId: triggerResult.messageId 
      };
    } else {
      console.log(`[WEBHOOK] No matching panic message found for message: ${messageBody}`);
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

/**
 * Handle message selection when multiple panic messages are available
 */
async function handleMessageSelection(userId: string, fromNumber: string, messageBody: string, panicConditions: any[]) {
  const supabase = createSupabaseAdmin();
  console.log(`[WEBHOOK] Processing message selection: ${messageBody}`);
  
  try {
    // If "ALL" selected, trigger all panic messages
    if (messageBody.toLowerCase() === "all") {
      console.log(`[WEBHOOK] Triggering ALL panic messages for user ${userId}`);
      
      const results = [];
      
      for (const condition of panicConditions) {
        const { data: triggerResult } = await supabase.functions.invoke("send-message-notifications", {
          body: {
            messageId: condition.message_id,
            isEmergency: true,
            debug: true,
            whatsAppEnabled: condition.panic_config?.methods?.includes('whatsapp') || false
          }
        });
        
        results.push({
          messageId: condition.message_id,
          result: triggerResult
        });
      }
      
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: fromNumber,
          message: `⚠️ ALL EMERGENCY ALERTS TRIGGERED (${results.length}). Your emergency messages have been sent to all recipients.`
        }
      });
      
      return { 
        status: "success", 
        message: `All emergency messages triggered (${results.length})`, 
        results 
      };
    }
    
    // Handle numeric selection
    const selection = parseInt(messageBody, 10);
    if (isNaN(selection) || selection < 1 || selection > panicConditions.length) {
      console.log(`[WEBHOOK] Invalid message selection: ${messageBody}`);
      
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: fromNumber,
          message: `Invalid selection. Please reply with a number between 1 and ${panicConditions.length}, or reply with ALL to trigger all messages.`
        }
      });
      
      return { 
        status: "error", 
        message: "Invalid message selection", 
        code: "INVALID_SELECTION"
      };
    }
    
    // Trigger the selected panic message (adjust index for 1-based numbering)
    const selectedCondition = panicConditions[selection - 1];
    console.log(`[WEBHOOK] Selected panic message ${selectedCondition.message_id} (${selection} of ${panicConditions.length})`);
    
    const { data: triggerResult } = await supabase.functions.invoke("send-message-notifications", {
      body: {
        messageId: selectedCondition.message_id,
        isEmergency: true,
        debug: true,
        whatsAppEnabled: selectedCondition.panic_config?.methods?.includes('whatsapp') || false
      }
    });
    
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: fromNumber,
        message: `⚠️ EMERGENCY ALERT #${selection} TRIGGERED. Your emergency message has been sent to all recipients.`
      }
    });
    
    return { 
      status: "success", 
      message: `Emergency message #${selection} triggered`, 
      messageId: selectedCondition.message_id,
      triggerResult
    };
  } catch (error) {
    console.error(`[WEBHOOK] Error in handleMessageSelection:`, error);
    return { 
      status: "error", 
      message: error.message || "Unknown error processing message selection",
      code: "SELECTION_ERROR"
    };
  }
}
