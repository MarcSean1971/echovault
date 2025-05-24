
import { useEffect, useCallback, useRef } from "react";

/**
 * Stable hook to manage condition-related events and listeners
 * Fixed to prevent excessive listener churn
 */
export function useConditionEvents(
  messageId: string,
  refreshData: () => void,
  invalidateCache: () => void,
  incrementRefreshCounter: () => void
) {
  const listenerRef = useRef<((event: Event) => void) | null>(null);
  const isSetupRef = useRef(false);

  /**
   * Handle conditions-updated event with stable reference
   */
  const handleConditionsUpdated = useCallback((event: Event) => {
    if (event instanceof CustomEvent) {
      const detail = event.detail || {};
      const eventMessageId = detail.messageId;
      const action = detail.action;
      const source = detail.source;
      
      // If event is for this specific message or it's a global update
      if (!eventMessageId || eventMessageId === messageId) {
        console.log(`[useConditionEvents ${messageId}] Received conditions-updated event:`, 
          'action:', action || 'update', 
          'source:', source || 'unknown',
          'messageId:', eventMessageId || 'global'
        );
        
        // Clear cache for this message
        invalidateCache();
        
        // Reload data
        refreshData();
        
        // Increment refresh counter to force re-render of timer
        incrementRefreshCounter();
      }
    }
  }, [messageId, refreshData, invalidateCache, incrementRefreshCounter]);

  // Set up event listener only once per messageId
  useEffect(() => {
    // Skip if already set up for this messageId
    if (isSetupRef.current && listenerRef.current) {
      return;
    }

    console.log(`[useConditionEvents] Setting up stable conditions-updated listener for message ${messageId}`);
    
    // Remove any existing listener
    if (listenerRef.current) {
      window.removeEventListener('conditions-updated', listenerRef.current);
    }
    
    // Create and store the stable listener
    listenerRef.current = handleConditionsUpdated;
    window.addEventListener('conditions-updated', listenerRef.current);
    isSetupRef.current = true;
    
    return () => {
      if (listenerRef.current) {
        console.log(`[useConditionEvents] Removing stable conditions-updated listener for message ${messageId}`);
        window.removeEventListener('conditions-updated', listenerRef.current);
        listenerRef.current = null;
        isSetupRef.current = false;
      }
    };
  }, [messageId]); // Only depend on messageId, not the callback

  // Update the callback reference without recreating listener
  useEffect(() => {
    if (listenerRef.current) {
      listenerRef.current = handleConditionsUpdated;
    }
  }, [handleConditionsUpdated]);
}
