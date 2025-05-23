
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
    
    // CRITICAL FIX: Trigger reminder schedule update for each affected message
    // This ensures that the reminder schedule is updated after a check-in
    for (const condition of conditions) {
      try {
        console.log(`[WEBHOOK] Triggering reminder update for message ${condition.message_id}`);
        await supabase.functions.invoke("send-reminder-emails", {
          body: { 
            messageId: condition.message_id,
            debug: true,
            forceSend: false,
            action: "update-after-checkin",
            source: "whatsapp-checkin"
          }
        });
      } catch (reminderError) {
        console.error(`[WEBHOOK] Error triggering reminder update for message ${condition.message_id}:`, reminderError);
        // Continue with other messages even if one fails
      }
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
    
    // CRITICAL FIX: Use maximum retries to increase reliability
    let sentSuccessfully = false;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries && !sentSuccessfully; attempt++) {
      try {
        const supabase = createSupabaseAdmin();
        const phoneToUse = attempt === 0 ? formattedPhone : 
                          attempt === 1 ? cleanPhone : 
                          `whatsapp:${cleanPhone}`;
                          
        console.log(`[WEBHOOK] Attempt #${attempt + 1}: Sending WhatsApp confirmation to ${phoneToUse}`);
        
        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: phoneToUse,
            message: message,
            useTemplate: false,
            retryCount: attempt
          }
        });
        
        if (error) {
          throw new Error(`Error from send-whatsapp: ${error.message}`);
        }
        
        console.log(`[WEBHOOK] WhatsApp confirmation sent successfully on attempt #${attempt + 1}:`, data);
        sentSuccessfully = true;
        break;
      } catch (attemptError) {
        console.error(`[WEBHOOK] Attempt #${attempt + 1} failed:`, attemptError);
        
        if (attempt < maxRetries - 1) {
          console.log(`[WEBHOOK] Will retry with different format...`);
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))); // Exponential backoff
        }
      }
    }
    
    return sentSuccessfully;
  } catch (error) {
    console.error(`[WEBHOOK] Error sending confirmation message:`, error);
    return false;
  }
}
