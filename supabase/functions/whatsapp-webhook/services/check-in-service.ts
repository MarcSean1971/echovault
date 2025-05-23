
import { createSupabaseAdmin } from "../../shared/supabase-client.ts";
import { performUserCheckIn } from "./user-check-in.ts";

/**
 * Process check-in request via WhatsApp
 * @param userId User ID to process check-in for
 * @param phoneNumber Phone number that sent the check-in
 * @returns Result of the check-in operation
 */
export async function processCheckIn(userId: string, phoneNumber: string) {
  const supabase = createSupabaseAdmin();
  
  console.log(`[WEBHOOK] Processing check-in for user: ${userId}`);
  
  try {
    // Process the check-in directly on all user conditions
    const checkInResult = await performUserCheckIn(supabase, userId);
    
    // Send confirmation to user
    await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: phoneNumber,
        message: "✅ CHECK-IN SUCCESSFUL. Your Trigger Switch has been reset."
      }
    });
    
    return checkInResult;
  } catch (error) {
    console.error(`[WEBHOOK] Error processing check-in for user ${userId}:`, error);
    
    // Try to send error message to user
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: phoneNumber,
          message: "❌ CHECK-IN FAILED. Please try again or contact support."
        }
      });
    } catch (msgError) {
      console.error(`[WEBHOOK] Failed to send error message to user:`, msgError);
    }
    
    throw error;
  }
}
