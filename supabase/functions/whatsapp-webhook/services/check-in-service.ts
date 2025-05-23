
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { formatWhatsAppNumber } from "../../shared/utils/phone-formatter.ts";

/**
 * Process a check-in from WhatsApp
 * @param userId The user ID that's checking in
 * @param phoneNumber The phone number that sent the check-in
 * @returns Processing result
 */
export async function processCheckIn(userId: string, phoneNumber: string) {
  try {
    console.log(`[WEBHOOK] Processing check-in for user ${userId} from phone ${phoneNumber}`);
    const supabase = createSupabaseAdmin();
    
    // Get current timestamp
    const now = new Date().toISOString();
    
    // Update all active conditions with the new check-in time
    const { data: conditions, error: fetchError } = await supabase
      .from("message_conditions")
      .select("id, message_id")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (fetchError) {
      console.error(`[WEBHOOK] Error fetching conditions:`, fetchError);
      return { 
        status: "error", 
        message: "Failed to process check-in", 
        code: "FETCH_ERROR"
      };
    }
    
    if (!conditions || conditions.length === 0) {
      console.log(`[WEBHOOK] No active conditions found for user ${userId}`);
      
      // Even if no conditions were found, send a confirmation message
      await sendConfirmationMessage(phoneNumber, 0);
      
      return { 
        status: "success", 
        message: "Check-in recorded, but no active conditions found",
        conditions_updated: 0
      };
    }
    
    console.log(`[WEBHOOK] Found ${conditions.length} conditions to update`);
    
    // Update all conditions with the new check-in time
    const { error: updateError } = await supabase
      .from("message_conditions")
      .update({ last_checked: now })
      .in("id", conditions.map(c => c.id));
    
    if (updateError) {
      console.error(`[WEBHOOK] Error updating conditions:`, updateError);
      return { 
        status: "error", 
        message: "Failed to update check-in time", 
        code: "UPDATE_ERROR" 
      };
    }
    
    // Send a confirmation message via WhatsApp
    await sendConfirmationMessage(phoneNumber, conditions.length);
    
    console.log(`[WEBHOOK] Successfully updated ${conditions.length} conditions for user ${userId}`);
    
    return { 
      status: "success", 
      message: "Check-in successful", 
      conditions_updated: conditions.length 
    };
    
  } catch (error) {
    console.error(`[WEBHOOK] Error in processCheckIn:`, error);
    return { 
      status: "error", 
      message: error.message || "Unknown error processing check-in",
      code: "PROCESSING_ERROR"
    };
  }
}

/**
 * Send a confirmation message back to the user via WhatsApp
 * @param phoneNumber The recipient's phone number
 * @param conditionsUpdated Number of conditions that were updated
 */
async function sendConfirmationMessage(phoneNumber: string, conditionsUpdated: number) {
  try {
    // Format phone number for WhatsApp
    const formattedPhone = formatWhatsAppNumber(phoneNumber);
    
    console.log(`[WEBHOOK] Sending check-in confirmation to ${formattedPhone}`);
    
    // Generate confirmation message based on conditions updated
    let message = "✅ Your check-in has been recorded.";
    
    if (conditionsUpdated > 0) {
      message += ` ${conditionsUpdated} condition${conditionsUpdated === 1 ? ' was' : 's were'} updated.`;
    } else {
      message += " No active conditions required updating.";
    }
    
    // Call the send-whatsapp function
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: formattedPhone,
        message: message,
        useTemplate: false
      }
    });
    
    if (error) {
      console.error(`[WEBHOOK] Error sending WhatsApp confirmation:`, error);
      return false;
    }
    
    console.log(`[WEBHOOK] WhatsApp confirmation sent successfully:`, data);
    return true;
  } catch (error) {
    console.error(`[WEBHOOK] Error sending confirmation message:`, error);
    return false;
  }
}
