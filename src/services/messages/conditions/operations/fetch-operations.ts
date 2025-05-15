
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition } from "@/types/message";
import { mapDbConditionToMessageCondition } from "../helpers/map-helpers";

/**
 * Fetches all message conditions from the database for a specific user
 */
export async function fetchConditionsFromDb(userId: string): Promise<MessageCondition[]> {
  const client = await getAuthClient();
  
  try {
    console.log(`[fetchConditionsFromDb] Fetching conditions for user: ${userId}`);
    
    // First, get all message IDs for this user
    const { data: messageData, error: messageError } = await client
      .from("messages")
      .select("id")
      .eq("user_id", userId);
    
    if (messageError) {
      console.error("[fetchConditionsFromDb] Error fetching messages:", messageError);
      throw new Error(messageError.message || "Failed to fetch messages");
    }
    
    // If no messages found, return empty array
    if (!messageData || messageData.length === 0) {
      console.log("[fetchConditionsFromDb] No messages found for user");
      return [];
    }
    
    // Extract message IDs
    const messageIds = messageData.map(msg => msg.id);
    console.log(`[fetchConditionsFromDb] Found ${messageIds.length} message IDs`);
    
    // Now fetch conditions based on these message IDs
    const { data, error } = await client
      .from("message_conditions")
      .select("*")
      .in("message_id", messageIds);

    if (error) {
      console.error("[fetchConditionsFromDb] Error fetching message conditions:", error);
      throw new Error(error.message || "Failed to fetch message conditions");
    }

    console.log(`[fetchConditionsFromDb] Successfully fetched ${data?.length || 0} conditions`);
    return (data || []).map(mapDbConditionToMessageCondition);
  } catch (error) {
    console.error("[fetchConditionsFromDb] Error:", error);
    throw error;
  }
}
