import { createSupabaseAdmin } from "../../shared/supabase-client.ts";

/**
 * Find a user by their WhatsApp phone number
 * @param fromNumber WhatsApp number to search for
 * @returns User ID if found, null otherwise
 */
export async function findUserByPhone(fromNumber: string): Promise<string | null> {
  const supabase = createSupabaseAdmin();
  let userId = null;
  
  // Check profiles table
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("whatsapp_number", fromNumber)
    .limit(1);
    
  if (profiles && profiles.length > 0) {
    userId = profiles[0].id;
    console.log(`[WEBHOOK] Found user via profiles table: ${userId}`);
    return userId;
  } 
  
  // Check recipients table as fallback
  const { data: recipients } = await supabase
    .from("recipients")
    .select("user_id")
    .eq("phone", fromNumber)
    .limit(1);
  
  if (recipients && recipients.length > 0) {
    userId = recipients[0].user_id;
    console.log(`[WEBHOOK] Found user via recipients table: ${userId}`);
    return userId;
  }
  
  console.log(`[WEBHOOK] No user found with phone number: ${fromNumber}`);
  return null;
}

// Add an alias function to keep both naming conventions working
export const getUserByPhoneNumber = findUserByPhone;
