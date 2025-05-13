
import { getAuthClient } from "@/lib/supabaseClient";

/**
 * Gets a message condition by message ID
 */
export async function getConditionByMessageId(messageId: string): Promise<any> {
  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .select("*")
    .eq("message_id", messageId)
    .single();
    
  if (error) {
    console.error("Error getting message condition:", error);
    throw new Error("Message not found or condition doesn't exist");
  }
  
  return data;
}
