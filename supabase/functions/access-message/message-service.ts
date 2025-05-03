
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get message by ID
 */
export async function getMessage(messageId: string) {
  const supabase = supabaseClient();
  return await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
}

/**
 * Get message condition by message ID
 */
export async function getMessageCondition(messageId: string) {
  const supabase = supabaseClient();
  return await supabase
    .from("message_conditions")
    .select("*")
    .eq("message_id", messageId)
    .single();
}
