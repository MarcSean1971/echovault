
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition } from "@/types/message";
import { mapDbConditionToMessageCondition } from "../helpers/map-helpers";

// Cache for conditions to avoid redundant fetches during the same render cycle
const conditionsCache = new Map<string, {
  conditions: MessageCondition[],
  timestamp: number
}>();

// Invalidate cache after 30 seconds
const CACHE_TTL = 30000; 

/**
 * Fetches all message conditions from the database for a specific user
 * Optimized to use our new indexes for active and condition_type
 */
export async function fetchConditionsFromDb(userId: string): Promise<MessageCondition[]> {
  // Check cache first
  const cacheKey = `user_${userId}`;
  const cachedData = conditionsCache.get(cacheKey);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    console.log(`[fetchConditionsFromDb] Using cached conditions for user: ${userId}`);
    return cachedData.conditions;
  }
  
  const client = await getAuthClient();
  
  try {
    console.log(`[fetchConditionsFromDb] Fetching conditions for user: ${userId}`);
    
    // Fetch messages and conditions in parallel for better performance
    // Uses our new index on messages.user_id
    const messagePromise = client
      .from("messages")
      .select("id")
      .eq("user_id", userId);
    
    // Await the message query to get IDs
    const { data: messageData, error: messageError } = await messagePromise;
    
    if (messageError) {
      console.error("[fetchConditionsFromDb] Error fetching messages:", messageError);
      throw new Error(messageError.message || "Failed to fetch messages");
    }
    
    // If no messages found, return empty array
    if (!messageData || messageData.length === 0) {
      console.log("[fetchConditionsFromDb] No messages found for user");
      
      // Cache empty result
      conditionsCache.set(cacheKey, {
        conditions: [],
        timestamp: now
      });
      
      return [];
    }
    
    // Extract message IDs
    const messageIds = messageData.map(msg => msg.id);
    console.log(`[fetchConditionsFromDb] Found ${messageIds.length} message IDs`);
    
    // Now fetch conditions based on these message IDs
    // This query will use our new index on active+condition_type when filtering
    const { data, error } = await client
      .from("message_conditions")
      .select("*")
      .in("message_id", messageIds)
      .order('updated_at', { ascending: false }); // Add order to improve cache hit rate

    if (error) {
      console.error("[fetchConditionsFromDb] Error fetching message conditions:", error);
      throw new Error(error.message || "Failed to fetch message conditions");
    }

    console.log(`[fetchConditionsFromDb] Successfully fetched ${data?.length || 0} conditions`);
    
    // Map and cache the conditions
    const conditions = (data || []).map(mapDbConditionToMessageCondition);
    
    conditionsCache.set(cacheKey, {
      conditions,
      timestamp: now
    });
    
    return conditions;
  } catch (error) {
    console.error("[fetchConditionsFromDb] Error:", error);
    throw error;
  }
}

// Function to invalidate the conditions cache
export function invalidateConditionsCache(userId?: string) {
  if (userId) {
    conditionsCache.delete(`user_${userId}`);
  } else {
    conditionsCache.clear();
  }
}
