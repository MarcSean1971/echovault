
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition } from "@/types/message";
import { mapDbConditionToMessageCondition } from "../helpers/map-helpers";

// Cache for conditions to avoid redundant fetches during the same render cycle
const conditionsCache = new Map<string, {
  conditions: MessageCondition[],
  timestamp: number
}>();

// Increase cache TTL to 60 seconds to reduce requests
const CACHE_TTL = 60000; 

/**
 * Fetches all message conditions from the database for a specific user
 * Optimized with better caching and error handling
 */
export async function fetchConditionsFromDb(userId: string): Promise<MessageCondition[]> {
  // Check cache first
  const cacheKey = `user_${userId}`;
  const cachedData = conditionsCache.get(cacheKey);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    console.log(`[fetchConditionsFromDb] Using cached conditions for user: ${userId}, count: ${cachedData.conditions.length}`);
    return cachedData.conditions;
  }
  
  // If we're here, we need to fetch from the database
  let client;
  try {
    client = await getAuthClient();
    console.log("[fetchConditionsFromDb] Successfully obtained auth client");
  } catch (error) {
    console.error("[fetchConditionsFromDb] Error getting auth client:", error);
    throw new Error("Authentication error: Could not connect to the database");
  }
  
  try {
    console.log(`[fetchConditionsFromDb] Fetching conditions for user: ${userId}`);
    
    // Set a timeout for the query to prevent it from hanging indefinitely
    const timeout = 8000; // 8 seconds timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Fetch messages and conditions in parallel for better performance
    // Uses our new index on messages.user_id with improved error handling
    const messagePromise = client
      .from("messages")
      .select("id")
      .eq("user_id", userId)
      .abortSignal(controller.signal);
    
    // Await the message query to get IDs
    const { data: messageData, error: messageError } = await messagePromise;
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
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
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("[fetchConditionsFromDb] Error fetching message conditions:", error);
      throw new Error(error.message || "Failed to fetch message conditions");
    }

    console.log(`[fetchConditionsFromDb] Successfully fetched ${data?.length || 0} conditions`);
    
    // If no data, return empty array instead of null
    if (!data || data.length === 0) {
      // Cache empty result
      conditionsCache.set(cacheKey, {
        conditions: [],
        timestamp: now
      });
      
      return [];
    }
    
    // Map and cache the conditions
    const conditions = data.map(mapDbConditionToMessageCondition);
    
    conditionsCache.set(cacheKey, {
      conditions,
      timestamp: now
    });
    
    return conditions;
  } catch (error: any) {
    // Check if this was an abort error (timeout)
    if (error.name === 'AbortError') {
      console.error("[fetchConditionsFromDb] Query timed out after 8 seconds");
      throw new Error("Database request timed out. Please try again.");
    }
    
    console.error("[fetchConditionsFromDb] Error:", error);
    throw error;
  }
}

// Function to invalidate the conditions cache
export function invalidateConditionsCache(userId?: string) {
  if (userId) {
    conditionsCache.delete(`user_${userId}`);
    console.log(`[invalidateConditionsCache] Invalidated cache for user ${userId}`);
  } else {
    conditionsCache.clear();
    console.log(`[invalidateConditionsCache] Cleared entire conditions cache`);
  }
}
