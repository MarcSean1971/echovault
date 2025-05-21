
import { MessageCondition } from "@/types/message";

// Cache for conditions to reduce redundant API calls
const conditionCache = new Map<string, {
  condition: MessageCondition | null,
  timestamp: number
}>();

// Cache TTL in milliseconds (reduced from 10 seconds to 2 seconds for more responsive updates)
const CACHE_TTL = 2000;

/**
 * Check if a condition exists in cache and is still valid
 */
export function getValidCachedCondition(messageId: string): {
  condition: MessageCondition | null,
  timestamp: number
} | undefined {
  const cachedData = conditionCache.get(messageId);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
    console.log(`[useMessageCondition] Using cached condition for message ${messageId}`);
    return cachedData;
  }
  
  return undefined;
}

/**
 * Set condition data in cache
 */
export function setCachedCondition(messageId: string, condition: MessageCondition | null): void {
  conditionCache.set(messageId, {
    condition,
    timestamp: Date.now()
  });
}

/**
 * Function to invalidate cache for a specific message ID or all messages
 */
export function invalidateConditionCache(messageId?: string) {
  if (messageId) {
    console.log(`[useMessageCondition] Invalidating cache for message ${messageId}`);
    conditionCache.delete(messageId);
  } else {
    console.log('[useMessageCondition] Invalidating all condition caches');
    conditionCache.clear();
  }
}
