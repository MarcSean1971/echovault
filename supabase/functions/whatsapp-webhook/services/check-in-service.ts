
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
      
      // Still try to send a confirmation - even if there was an error
      await sendConfirmationMessage(phoneNumber, 0, true);
      
      return { 
        status: "error", 
        message: "Failed to process check-in", 
        code: "FETCH_ERROR"
      };
    }
    
    if (!conditions || conditions.length === 0) {
      console.log(`[WEBHOOK] No active conditions found for user ${userId}`);
      
      // Even if no conditions were found, send a confirmation message
      const confirmationSent = await sendConfirmationMessage(phoneNumber, 0);
      
      return { 
        status: "success", 
        message: "Check-in recorded, but no active conditions found",
        conditions_updated: 0,
        confirmation_sent: confirmationSent
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
      
      // Still try to send a confirmation even though the update failed
      await sendConfirmationMessage(phoneNumber, 0, true);
      
      return { 
        status: "error", 
        message: "Failed to update check-in time", 
        code: "UPDATE_ERROR" 
      };
    }
    
    // Send a confirmation message via WhatsApp
    const confirmationSent = await sendConfirmationMessage(phoneNumber, conditions.length);
    
    console.log(`[WEBHOOK] Successfully updated ${conditions.length} conditions for user ${userId}`);
    console.log(`[WEBHOOK] Confirmation message sent: ${confirmationSent ? 'Yes' : 'No'}`);
    
    return { 
      status: "success", 
      message: "Check-in successful", 
      conditions_updated: conditions.length,
      confirmation_sent: confirmationSent
    };
    
  } catch (error) {
    console.error(`[WEBHOOK] Error in processCheckIn:`, error);
    
    // Try to send a confirmation message even if there was an error
    try {
      await sendConfirmationMessage(phoneNumber, 0, true);
    } catch (msgError) {
      console.error(`[WEBHOOK] Failed to send error confirmation:`, msgError);
    }
    
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
 * @param isError Whether this is an error situation
 * @returns Boolean indicating if the message was sent successfully
 */
async function sendConfirmationMessage(phoneNumber: string, conditionsUpdated: number, isError = false) {
  try {
    // Clean up phone number for more reliable formatting
    // Remove any existing "whatsapp:" prefix and whitespace
    let cleanPhone = phoneNumber.replace("whatsapp:", "").trim();
    
    // Ensure it starts with "+" for international format if it's just numbers
    if (!/^\+/.test(cleanPhone) && /^\d+$/.test(cleanPhone.replace(/\D/g, ''))) {
      cleanPhone = "+" + cleanPhone.replace(/\D/g, '');
    }
    
    // Format phone number for WhatsApp - try both with and without the whatsapp: prefix
    // This will make the code more robust to different phone number formats
    const formattedPhone = formatWhatsAppNumber(cleanPhone);
    
    console.log(`[WEBHOOK] Sending check-in confirmation to ${formattedPhone}`);
    
    // Generate confirmation message based on conditions updated
    let message = "✅ Your check-in has been recorded.";
    
    if (isError) {
      message = "✅ Your check-in was received, but there was an issue updating your deadlines. Your message was recorded.";
    } else if (conditionsUpdated > 0) {
      message += ` ${conditionsUpdated} condition${conditionsUpdated === 1 ? ' was' : 's were'} updated.`;
    } else {
      message += " No active conditions required updating.";
    }
    
    // First try: Call the send-whatsapp function with formatted number
    try {
      const supabase = createSupabaseAdmin();
      console.log(`[WEBHOOK] Attempting to send WhatsApp confirmation with formatted number: ${formattedPhone}`);
      
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: formattedPhone,
          message: message,
          useTemplate: false
        }
      });
      
      if (error) {
        throw new Error(`Error from send-whatsapp: ${error.message}`);
      }
      
      console.log(`[WEBHOOK] WhatsApp confirmation sent successfully:`, data);
      return true;
    } catch (firstError) {
      console.error(`[WEBHOOK] First attempt failed:`, firstError);
      
      // Second try: If the first attempt failed, try with a different phone format
      try {
        console.log(`[WEBHOOK] Trying alternate phone format...`);
        // Try without the whatsapp: prefix if it had one, or with it if it didn't
        const alternatePhone = phoneNumber.includes("whatsapp:") ? 
          cleanPhone : 
          `whatsapp:${cleanPhone}`;
        
        console.log(`[WEBHOOK] Alternate phone format: ${alternatePhone}`);
        
        const supabase = createSupabaseAdmin();
        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: alternatePhone,
            message: message,
            useTemplate: false
          }
        });
        
        if (error) {
          throw new Error(`Error from send-whatsapp with alternate format: ${error.message}`);
        }
        
        console.log(`[WEBHOOK] WhatsApp confirmation sent successfully with alternate format:`, data);
        return true;
      } catch (secondError) {
        console.error(`[WEBHOOK] Both attempts failed:`, secondError);
        return false;
      }
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error sending confirmation message:`, error);
    return false;
  }
}
