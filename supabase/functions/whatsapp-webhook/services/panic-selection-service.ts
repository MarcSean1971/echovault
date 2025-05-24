
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { createSelectionKey, logPhoneDebugInfo } from "../utils/phone-utils.ts";

// In-memory storage for selection states (increased expiration time to 5 minutes)
const selectionStates = new Map<string, {
  userId: string;
  phoneNumber: string;
  panicConditions: any[];
  createdAt: Date;
}>();

// Clean up expired selection states (older than 5 minutes now)
function cleanupExpiredStates() {
  const now = new Date();
  const expiredKeys: string[] = [];
  
  console.log(`[PANIC-SELECTION] Starting cleanup, current states: ${selectionStates.size}`);
  
  for (const [key, state] of selectionStates.entries()) {
    const ageMs = now.getTime() - state.createdAt.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    
    if (ageMs > 300000) { // 5 minutes instead of 2
      expiredKeys.push(key);
      console.log(`[PANIC-SELECTION] Marking key ${key} for expiration (age: ${ageMinutes.toFixed(2)} minutes)`);
    } else {
      console.log(`[PANIC-SELECTION] Keeping key ${key} (age: ${ageMinutes.toFixed(2)} minutes)`);
    }
  }
  
  expiredKeys.forEach(key => {
    selectionStates.delete(key);
    console.log(`[PANIC-SELECTION] Deleted expired key: ${key}`);
  });
  
  console.log(`[PANIC-SELECTION] Cleanup complete, remaining states: ${selectionStates.size}`);
}

/**
 * Store user's selection state for multiple panic messages
 */
export function storeSelectionState(userId: string, phoneNumber: string, panicConditions: any[]) {
  cleanupExpiredStates();
  
  logPhoneDebugInfo("STORE", userId, phoneNumber);
  
  const key = createSelectionKey(userId, phoneNumber);
  selectionStates.set(key, {
    userId,
    phoneNumber,
    panicConditions,
    createdAt: new Date()
  });
  
  console.log(`[PANIC-SELECTION] Stored selection state for key ${key} with ${panicConditions.length} conditions`);
  console.log(`[PANIC-SELECTION] Current stored keys: [${Array.from(selectionStates.keys()).join(', ')}]`);
}

/**
 * Get user's selection state
 */
export function getSelectionState(userId: string, phoneNumber: string) {
  cleanupExpiredStates();
  
  logPhoneDebugInfo("RETRIEVE", userId, phoneNumber);
  
  const key = createSelectionKey(userId, phoneNumber);
  const state = selectionStates.get(key);
  
  console.log(`[PANIC-SELECTION] Looking for key: ${key}`);
  console.log(`[PANIC-SELECTION] Available keys: [${Array.from(selectionStates.keys()).join(', ')}]`);
  console.log(`[PANIC-SELECTION] State found: ${state ? 'YES' : 'NO'}`);
  
  if (state) {
    const ageMs = new Date().getTime() - state.createdAt.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    console.log(`[PANIC-SELECTION] State age: ${ageMinutes.toFixed(2)} minutes`);
  }
  
  return state;
}

/**
 * Clear user's selection state
 */
export function clearSelectionState(userId: string, phoneNumber: string) {
  const key = createSelectionKey(userId, phoneNumber);
  const deleted = selectionStates.delete(key);
  
  console.log(`[PANIC-SELECTION] ${deleted ? 'Cleared' : 'Failed to clear'} selection state for key ${key}`);
  console.log(`[PANIC-SELECTION] Remaining keys after clear: [${Array.from(selectionStates.keys()).join(', ')}]`);
  
  return deleted;
}

/**
 * Send WhatsApp response message
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
    console.error(`[PANIC-SELECTION] Error sending WhatsApp response: ${error.message}`);
  }
}

/**
 * Handle panic message selection when multiple options are available
 */
export async function handlePanicMessageSelection(userId: string, phoneNumber: string, panicConditions: any[]) {
  console.log(`[PANIC-SELECTION] Handling panic message selection for ${panicConditions.length} conditions`);
  
  // Store the selection state
  storeSelectionState(userId, phoneNumber, panicConditions);
  
  // Build clean, concise selection message
  let selectionMessage = "EMERGENCY - Select message:\n\n";
  
  panicConditions.forEach((condition, index) => {
    const title = condition.messages?.title || "Emergency Message";
    selectionMessage += `${index + 1}. ${title}\n`;
  });
  
  selectionMessage += "\nReply: 1, 2, 3... or CANCEL";
  
  // Send selection message
  await sendWhatsAppResponse(phoneNumber, selectionMessage);
  
  console.log(`[PANIC-SELECTION] Sent selection message to ${phoneNumber} with ${panicConditions.length} options`);
  
  return {
    status: "selection_required",
    message: "Panic message selection sent",
    optionCount: panicConditions.length
  };
}

/**
 * Process user's selection response
 */
export async function processSelectionResponse(userId: string, phoneNumber: string, response: string) {
  console.log(`[PANIC-SELECTION] Processing selection response: "${response}" from user ${userId}, phone ${phoneNumber}`);
  
  const selectionState = getSelectionState(userId, phoneNumber);
  
  if (!selectionState) {
    console.log(`[PANIC-SELECTION] No selection state found for user ${userId}, phone ${phoneNumber}`);
    
    // Add fallback logging to help diagnose the issue
    console.log(`[PANIC-SELECTION] DEBUG: All current states:`);
    for (const [key, state] of selectionStates.entries()) {
      console.log(`  - Key: ${key}, UserID: ${state.userId}, Phone: ${state.phoneNumber}`);
    }
    
    return null;
  }
  
  const responseUpper = response.toUpperCase().trim();
  
  // Handle cancellation
  if (responseUpper === 'CANCEL' || responseUpper === 'ABORT' || responseUpper === 'STOP') {
    clearSelectionState(userId, phoneNumber);
    await sendWhatsAppResponse(phoneNumber, "Emergency cancelled");
    
    return {
      status: "cancelled",
      message: "Selection cancelled by user"
    };
  }
  
  // Handle numeric selection
  const selectionNumber = parseInt(response.trim());
  
  if (isNaN(selectionNumber) || selectionNumber < 1 || selectionNumber > selectionState.panicConditions.length) {
    await sendWhatsAppResponse(
      phoneNumber, 
      `Invalid. Reply: 1-${selectionState.panicConditions.length} or CANCEL`
    );
    
    return {
      status: "invalid_selection",
      message: "Invalid selection number"
    };
  }
  
  // Get the selected panic condition
  const selectedCondition = selectionState.panicConditions[selectionNumber - 1];
  const selectedTitle = selectedCondition.messages?.title || "Emergency Message";
  
  // Clear the selection state
  clearSelectionState(userId, phoneNumber);
  
  console.log(`[PANIC-SELECTION] User ${userId} selected option ${selectionNumber}: ${selectedTitle}`);
  
  return {
    status: "selected",
    message: "Valid selection made",
    selectedCondition,
    selectedTitle,
    message_id: selectedCondition.message_id
  };
}

/**
 * Send WhatsApp response message
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
    console.error(`[PANIC-SELECTION] Error sending WhatsApp response: ${error.message}`);
  }
}
