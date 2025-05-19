
/**
 * Utility functions for invalidating various caches in the application
 * to ensure data consistency
 */

import { invalidateConditionsCache } from "@/services/messages/conditions/operations/fetch-operations";

/**
 * Invalidate all condition-related caches
 * @param messageId Optional specific message ID to invalidate
 */
export function invalidateConditionCaches(messageId?: string) {
  console.log(`[cacheInvalidation] Invalidating condition caches${messageId ? ` for message ${messageId}` : ''}`);
  
  // Invalidate the conditions cache from fetch operations
  invalidateConditionsCache();
  
  // Dispatch a conditions-updated event to trigger refreshes in components that listen for it
  const event = new CustomEvent('conditions-updated', {
    detail: { messageId, source: 'cache-invalidation' }
  });
  
  window.dispatchEvent(event);
}

/**
 * Invalidate all message-related caches
 * @param messageId Optional specific message ID to invalidate
 */
export function invalidateMessageCaches(messageId?: string) {
  console.log(`[cacheInvalidation] Invalidating message caches${messageId ? ` for message ${messageId}` : ''}`);
  
  // Also invalidate condition caches since they're related
  invalidateConditionCaches(messageId);
  
  // Add future message cache invalidation here if implemented
}
