
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition } from "@/types/message";
import { mapDbConditionToMessageCondition } from "./dbOperations";

/**
 * Fetches a message condition by message ID
 * @param messageId The ID of the message to fetch condition for
 */
export async function getConditionByMessageId(messageId: string): Promise<MessageCondition | null> {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client
      .from("message_conditions")
      .select("*")
      .eq("message_id", messageId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching message condition:", error);
      throw new Error(error.message);
    }
    
    if (!data) return null;
    
    return mapDbConditionToMessageCondition(data);
  } catch (error) {
    console.error("Error in getConditionByMessageId:", error);
    throw error;
  }
}
