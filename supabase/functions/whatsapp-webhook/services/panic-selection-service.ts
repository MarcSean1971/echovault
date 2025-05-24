import { createSupabaseAdmin } from "../../shared/supabase-client.ts";

// In-memory storage for selection states (in production, you might want to use Redis or database)
const selectionStates = new Map<string, {
  userId: string;
  phoneNumber: string;
  panicConditions: any[];
  createdAt: Date;
}>();

// Clean up expired selection states (older than 2 minutes)
function cleanupExpiredStates() {
  const now = new Date();
  const expiredKeys: string[] = [];
  
  for (const [key, state] of selectionStates.entries()) {
    if (now.getTime() - state.createdAt.getTime() > 120000) { // 2 minutes
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => selectionStates.delete(key));
}

/**
 * Store user's selection state for multiple panic messages
 */
export function storeSelectionState(userId: string, phoneNumber: string, panicConditions: any[]) {
  cleanupExpiredStates();
  
  const key = `${userId}-${phoneNumber}`;
  selectionStates.set(key, {
    userId,
    phoneNumber,
    panicConditions,
    createdAt: new Date()
  });
  
  console.log(`[PANIC-SELECTION] Stored selection state for user ${userId}`);
}

/**
 * Get user's selection state
 */
export function getSelectionState(userId: string, phoneNumber: string) {
  cleanupExpiredStates();
  
  const key = `${userId}-${phoneNumber}`;
  return selectionStates.get(key);
}

/**
 * Clear user's selection state
 */
export function clearSelectionState(userId: string, phoneNumber: string) {
  const key = `${userId}-${phoneNumber}`;
  const deleted = selectionStates.delete(key);
  
  if (deleted) {
    console.log(`[PANIC-SELECTION] Cleared selection state for user ${userId}`);
  }
  
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
  // Store the selection state
  storeSelectionState(userId, phoneNumber, panicConditions);
  
  // Build user-friendly selection message with EchoVault branding
  let selectionMessage = "🚨 *EchoVault Emergency Alert*\n\n";
  selectionMessage += "Multiple emergency messages found! Please select which one to send:\n\n";
  
  panicConditions.forEach((condition, index) => {
    const title = condition.title || "Emergency Message";
    const preview = condition.content ? 
      (condition.content.length > 50 ? condition.content.substring(0, 50) + "..." : condition.content) : 
      "No preview available";
    
    selectionMessage += `*${index + 1}.* ${title}\n`;
    selectionMessage += `   _${preview}_\n\n`;
  });
  
  selectionMessage += "📱 *How to respond:*\n";
  selectionMessage += "• Reply with the number (1, 2, 3, etc.) to select\n";
  selectionMessage += "• Send *CANCEL* to abort\n\n";
  selectionMessage += "⏱️ _You have 2 minutes to select. EchoVault is standing by._";
  
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
  const selectionState = getSelectionState(userId, phoneNumber);
  
  if (!selectionState) {
    console.log(`[PANIC-SELECTION] No selection state found for user ${userId}`);
    return null;
  }
  
  const responseUpper = response.toUpperCase().trim();
  
  // Handle cancellation
  if (responseUpper === 'CANCEL' || responseUpper === 'ABORT' || responseUpper === 'STOP') {
    clearSelectionState(userId, phoneNumber);
    await sendWhatsAppResponse(phoneNumber, "❌ *Emergency Alert Cancelled*\n\nYour emergency message selection has been cancelled.\n\n_EchoVault is here when you need us._");
    
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
      `❌ *Invalid Selection*\n\nPlease reply with a number between *1* and *${selectionState.panicConditions.length}*, or *CANCEL* to abort.\n\n_EchoVault is waiting for your response._`
    );
    
    return {
      status: "invalid_selection",
      message: "Invalid selection number"
    };
  }
  
  // Get the selected panic condition
  const selectedCondition = selectionState.panicConditions[selectionNumber - 1];
  const selectedTitle = selectedCondition.title || "Emergency Message";
  
  // Clear the selection state
  clearSelectionState(userId, phoneNumber);
  
  console.log(`[PANIC-SELECTION] User ${userId} selected option ${selectionNumber}: ${selectedTitle}`);
  
  return {
    status: "selected",
    message: "Valid selection made",
    selectedCondition,
    selectedTitle,
    messageId: selectedCondition.messageId
  };
}
