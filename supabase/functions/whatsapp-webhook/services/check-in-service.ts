
import { createSupabaseAdmin } from "../../shared/services/whatsapp-service.ts";

/**
 * Process a check-in message from WhatsApp
 */
export async function processCheckIn(userId: string, phoneNumber: string) {
  try {
    console.log(`[CHECK-IN] Processing check-in for user ${userId} from ${phoneNumber}`);
    
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    
    // Update all active conditions for this user with the new check-in time
    const { data: conditionsData, error: conditionsError } = await supabase
      .from("message_conditions")
      .select("id, message_id, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true);
      
    if (conditionsError) {
      throw new Error(`Error fetching conditions: ${conditionsError.message}`);
    }
    
    console.log(`[CHECK-IN] Found ${conditionsData?.length || 0} active conditions for user ${userId}`);
    
    // Update all conditions with the new check-in time
    if (conditionsData && conditionsData.length > 0) {
      const conditionIds = conditionsData.map(c => c.id);
      
      const { error: updateError } = await supabase
        .from("message_conditions")
        .update({ last_checked: now })
        .in("id", conditionIds);
        
      if (updateError) {
        throw new Error(`Failed to update conditions: ${updateError.message}`);
      }
      
      console.log("[CHECK-IN] Successfully updated conditions with new check-in time");
    }
    
    // FIXED: Clean the phone number - remove whatsapp: prefix like SOS system does
    let cleanPhone = phoneNumber;
    if (cleanPhone.startsWith('whatsapp:')) {
      cleanPhone = cleanPhone.replace('whatsapp:', '');
    }
    
    console.log(`[CHECK-IN] Sending confirmation to clean phone: ${cleanPhone} (original: ${phoneNumber})`);
    
    try {
      const { data: confirmationResult, error: confirmationError } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: cleanPhone, // Send clean phone number without whatsapp: prefix
          message: `✅ Check-in received! Your deadman's switch timers have been reset. Time: ${new Date().toLocaleTimeString()}`
        }
      });
      
      if (confirmationError) {
        console.error("[CHECK-IN] Error sending confirmation:", confirmationError);
      } else {
        console.log("[CHECK-IN] Confirmation message sent successfully");
      }
    } catch (confirmationError) {
      console.error("[CHECK-IN] Exception sending confirmation:", confirmationError);
    }
    
    return {
      success: true,
      timestamp: now,
      conditions_updated: conditionsData?.length || 0,
      message: "Check-in processed successfully"
    };
    
  } catch (error) {
    console.error("[CHECK-IN] Error processing check-in:", error);
    return {
      success: false,
      error: error.message || "Failed to process check-in"
    };
  }
}
