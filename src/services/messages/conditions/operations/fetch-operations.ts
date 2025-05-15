
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition } from "@/types/message";
import { mapDbConditionToMessageCondition } from "../helpers/map-helpers";

// Set timeout for database operations
const DB_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Fetches all message conditions from the database for a specific user with improved error handling
 */
export async function fetchConditionsFromDb(userId: string): Promise<MessageCondition[]> {
  if (!userId) {
    console.error("[fetchConditionsFromDb] No user ID provided");
    throw new Error("User ID is required to fetch conditions");
  }
  
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Database operation timed out after ' + DB_TIMEOUT_MS + 'ms'));
    }, DB_TIMEOUT_MS);
  });
  
  try {
    console.log(`[fetchConditionsFromDb] Fetching conditions for user: ${userId}`);
    
    // Get authenticated client with a fresh token
    const client = await getAuthClient();
    
    // Race against timeout
    const messageData = await Promise.race([
      client
        .from("messages")
        .select("id")
        .eq("user_id", userId),
      timeoutPromise
    ]);
    
    // Type assertion since we know messageData is the result of the query if we get here
    const { data: messageIds, error: messageError } = messageData as any;
    
    if (messageError) {
      console.error("[fetchConditionsFromDb] Error fetching messages:", messageError);
      throw new Error(messageError.message || "Failed to fetch messages");
    }
    
    // If no messages found, return empty array
    if (!messageIds || messageIds.length === 0) {
      console.log("[fetchConditionsFromDb] No messages found for user");
      return [];
    }
    
    // Extract message IDs
    const ids = messageIds.map((msg: any) => msg.id);
    console.log(`[fetchConditionsFromDb] Found ${ids.length} message IDs`);
    
    // Fetch conditions with timeout
    const conditionsData = await Promise.race([
      client
        .from("message_conditions")
        .select("*")
        .in("message_id", ids),
      timeoutPromise
    ]);
    
    // Type assertion
    const { data: conditions, error } = conditionsData as any;

    if (error) {
      console.error("[fetchConditionsFromDb] Error fetching message conditions:", error);
      throw new Error(error.message || "Failed to fetch message conditions");
    }

    console.log(`[fetchConditionsFromDb] Successfully fetched ${conditions?.length || 0} conditions`);
    return (conditions || []).map(mapDbConditionToMessageCondition);
  } catch (error: any) {
    console.error("[fetchConditionsFromDb] Error:", error);
    // Enhanced error for better debugging
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      console.error("[fetchConditionsFromDb] Network error - check connection");
      throw new Error("Network error - please check your internet connection");
    } else if (error.message?.includes('timed out')) {
      console.error("[fetchConditionsFromDb] Database operation timed out");
      throw new Error("Operation timed out - please try again");
    } else if (error.status === 401 || error.message?.includes('auth') || error.message?.includes('token')) {
      console.error("[fetchConditionsFromDb] Authentication error - refreshing session recommended");
      throw new Error("Authentication error - please sign in again");
    }
    throw error;
  }
}
