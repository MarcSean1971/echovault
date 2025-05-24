
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { createSelectionKey, logPhoneDebugInfo } from "../utils/phone-utils.ts";

/**
 * Clean up expired selection states from database
 */
async function cleanupExpiredStates() {
  const supabase = createSupabaseAdmin();
  
  console.log(`[PANIC-SELECTION] Starting cleanup of expired states`);
  
  try {
    const { data, error } = await supabase
      .from('panic_selections')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();
    
    if (error) {
      console.error(`[PANIC-SELECTION] Error during cleanup: ${error.message}`);
    } else {
      console.log(`[PANIC-SELECTION] Cleanup complete, removed ${data?.length || 0} expired states`);
    }
  } catch (error) {
    console.error(`[PANIC-SELECTION] Exception during cleanup: ${error.message}`);
  }
}

/**
 * Store user's selection state in database
 */
export async function storeSelectionState(userId: string, phoneNumber: string, panicConditions: any[]) {
  await cleanupExpiredStates();
  
  logPhoneDebugInfo("STORE", userId, phoneNumber);
  
  const supabase = createSupabaseAdmin();
  
  try {
    // First, clear any existing selection for this user/phone
    await supabase
      .from('panic_selections')
      .delete()
      .eq('user_id', userId)
      .eq('phone_number', phoneNumber);
    
    // Insert new selection state
    const { data, error } = await supabase
      .from('panic_selections')
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        panic_conditions: panicConditions
      })
      .select()
      .single();
    
    if (error) {
      console.error(`[PANIC-SELECTION] Error storing selection state: ${error.message}`);
      return false;
    }
    
    console.log(`[PANIC-SELECTION] Stored selection state for user ${userId} with ${panicConditions.length} conditions`);
    return true;
    
  } catch (error) {
    console.error(`[PANIC-SELECTION] Exception storing selection state: ${error.message}`);
    return false;
  }
}

/**
 * Get user's selection state from database
 */
export async function getSelectionState(userId: string, phoneNumber: string) {
  await cleanupExpiredStates();
  
  logPhoneDebugInfo("RETRIEVE", userId, phoneNumber);
  
  const supabase = createSupabaseAdmin();
  
  try {
    const { data, error } = await supabase
      .from('panic_selections')
      .select('*')
      .eq('user_id', userId)
      .eq('phone_number', phoneNumber)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log(`[PANIC-SELECTION] No selection state found for user ${userId}, phone ${phoneNumber}`);
        return null;
      }
      console.error(`[PANIC-SELECTION] Error retrieving selection state: ${error.message}`);
      return null;
    }
    
    if (data) {
      const ageMs = new Date().getTime() - new Date(data.created_at).getTime();
      const ageMinutes = ageMs / (1000 * 60);
      console.log(`[PANIC-SELECTION] Found selection state for user ${userId}, age: ${ageMinutes.toFixed(2)} minutes`);
      
      return {
        userId: data.user_id,
        phoneNumber: data.phone_number,
        panicConditions: data.panic_conditions,
        createdAt: new Date(data.created_at)
      };
    }
    
    return null;
    
  } catch (error) {
    console.error(`[PANIC-SELECTION] Exception retrieving selection state: ${error.message}`);
    return null;
  }
}

/**
 * Clear user's selection state from database
 */
export async function clearSelectionState(userId: string, phoneNumber: string) {
  const supabase = createSupabaseAdmin();
  
  try {
    const { data, error } = await supabase
      .from('panic_selections')
      .delete()
      .eq('user_id', userId)
      .eq('phone_number', phoneNumber)
      .select();
    
    if (error) {
      console.error(`[PANIC-SELECTION] Error clearing selection state: ${error.message}`);
      return false;
    }
    
    const deleted = data && data.length > 0;
    console.log(`[PANIC-SELECTION] ${deleted ? 'Cleared' : 'No state to clear for'} user ${userId}, phone ${phoneNumber}`);
    
    return deleted;
    
  } catch (error) {
    console.error(`[PANIC-SELECTION] Exception clearing selection state: ${error.message}`);
    return false;
  }
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
  
  // Store the selection state in database
  const stored = await storeSelectionState(userId, phoneNumber, panicConditions);
  
  if (!stored) {
    console.error(`[PANIC-SELECTION] Failed to store selection state`);
    await sendWhatsAppResponse(phoneNumber, "System error. Try again.");
    return {
      status: "error",
      message: "Failed to store selection state"
    };
  }
  
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
  
  const selectionState = await getSelectionState(userId, phoneNumber);
  
  if (!selectionState) {
    console.log(`[PANIC-SELECTION] No selection state found for user ${userId}, phone ${phoneNumber}`);
    return null;
  }
  
  const responseUpper = response.toUpperCase().trim();
  
  // Handle cancellation
  if (responseUpper === 'CANCEL' || responseUpper === 'ABORT' || responseUpper === 'STOP') {
    await clearSelectionState(userId, phoneNumber);
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
  await clearSelectionState(userId, phoneNumber);
  
  console.log(`[PANIC-SELECTION] User ${userId} selected option ${selectionNumber}: ${selectedTitle}`);
  
  return {
    status: "selected",
    message: "Valid selection made",
    selectedCondition,
    selectedTitle,
    message_id: selectedCondition.message_id
  };
}
