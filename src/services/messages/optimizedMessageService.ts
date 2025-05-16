
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

/**
 * Fetches complete message details including condition and delivery status in a single request
 * This optimized function reduces the number of separate database calls
 */
export async function fetchMessageDetails(messageId: string) {
  try {
    console.log(`[optimizedMessageService] Fetching complete details for message: ${messageId}`);
    
    // Single query to get message with condition and delivery status
    const { data, error } = await supabase
      .rpc('get_message_details', { 
        p_message_id: messageId
      });
    
    if (error) {
      console.error("Error in fetchMessageDetails:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return { message: null, condition: null, delivery: null, recipients: [] };
    }
    
    // Process the returned data
    const result = data[0];
    const messageData = result.message;
    const conditionData = result.condition;
    const deliveryData = result.delivery;
    const recipientsData = result.recipients || [];
    
    console.log(`[optimizedMessageService] Successfully fetched message details`);
    
    return {
      message: messageData as Message,
      condition: conditionData,
      delivery: deliveryData,
      recipients: recipientsData
    };
  } catch (error) {
    console.error("Error fetching message details:", error);
    toast({
      title: "Error",
      description: "Failed to load message details",
      variant: "destructive"
    });
    
    throw error;
  }
}

/**
 * Cache-enabled message details fetcher with automatic expiry
 */
const messageCache = new Map();
const CACHE_EXPIRY = 60000; // 1 minute cache

export async function fetchMessageDetailsWithCache(messageId: string) {
  // Check cache first
  const cachedData = messageCache.get(messageId);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRY)) {
    console.log(`[optimizedMessageService] Using cached message details for ${messageId}`);
    return cachedData.data;
  }
  
  // Fetch fresh data
  const data = await fetchMessageDetails(messageId);
  
  // Update cache
  messageCache.set(messageId, {
    data,
    timestamp: now
  });
  
  return data;
}

/**
 * Invalidate cache for a specific message
 */
export function invalidateMessageCache(messageId: string) {
  messageCache.delete(messageId);
  console.log(`[optimizedMessageService] Cache invalidated for message ${messageId}`);
}

/**
 * Clear entire message cache
 */
export function clearMessageCache() {
  messageCache.clear();
  console.log(`[optimizedMessageService] Full message cache cleared`);
}
