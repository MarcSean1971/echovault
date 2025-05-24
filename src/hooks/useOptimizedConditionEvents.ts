
import { useEffect, useRef } from 'react';

interface UseOptimizedConditionEventsProps {
  messageId: string;
  onConditionsUpdated: () => void;
  enabled?: boolean;
}

/**
 * Optimized condition events hook that prevents excessive listener churn
 * Fixes the performance issue where listeners were being added/removed every second
 */
export function useOptimizedConditionEvents({
  messageId,
  onConditionsUpdated,
  enabled = true
}: UseOptimizedConditionEventsProps) {
  const listenerRef = useRef<((event: CustomEvent) => void) | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !messageId) {
      return;
    }

    // Only add/remove listener if message ID actually changed
    if (currentMessageIdRef.current === messageId && listenerRef.current) {
      return;
    }

    // Clean up previous listener if it exists
    if (listenerRef.current && currentMessageIdRef.current) {
      window.removeEventListener('conditions-updated', listenerRef.current);
      console.log(`[useOptimizedConditionEvents] Cleaned up listener for message ${currentMessageIdRef.current}`);
    }

    // Create new listener function
    const handleConditionsUpdated = (event: CustomEvent) => {
      if (event.detail?.messageId === messageId) {
        console.log(`[useOptimizedConditionEvents] Conditions updated for message ${messageId}`);
        onConditionsUpdated();
      }
    };

    // Add the new listener
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    listenerRef.current = handleConditionsUpdated;
    currentMessageIdRef.current = messageId;
    
    console.log(`[useOptimizedConditionEvents] Set up optimized listener for message ${messageId}`);

    // Cleanup function
    return () => {
      if (listenerRef.current && currentMessageIdRef.current) {
        window.removeEventListener('conditions-updated', listenerRef.current);
        console.log(`[useOptimizedConditionEvents] Removed optimized listener for message ${currentMessageIdRef.current}`);
        listenerRef.current = null;
        currentMessageIdRef.current = null;
      }
    };
  }, [messageId, enabled]); // Only depend on messageId and enabled, not onConditionsUpdated

  // Separate effect for callback updates that doesn't trigger listener recreation
  useEffect(() => {
    if (listenerRef.current) {
      // Update the callback reference without recreating the listener
      const currentListener = listenerRef.current;
      const originalHandler = currentListener;
      
      // Replace the listener's callback
      listenerRef.current = (event: CustomEvent) => {
        if (event.detail?.messageId === messageId) {
          onConditionsUpdated();
        }
      };
    }
  }, [onConditionsUpdated, messageId]);
}
