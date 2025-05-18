
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
  
  // Process the check-in directly on all user conditions
  const checkInResult = await performUserCheckIn(supabase, userId);
  
  // Send confirmation to user
  await supabase.functions.invoke("send-whatsapp", {
    body: {
      to: phoneNumber,
      message: "✅ CHECK-IN SUCCESSFUL. Your dead man's switch has been reset."
    }
  });
  
  return checkInResult;
}

