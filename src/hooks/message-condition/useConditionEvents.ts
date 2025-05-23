
import { useEffect, useCallback } from "react";

/**
 * Hook to manage condition-related events and listeners
 */
export function useConditionEvents(
  messageId: string,
  refreshData: () => void,
  invalidateCache: () => void,
  incrementRefreshCounter: () => void
) {
  /**
   * Handle conditions-updated event
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
  
  // Set up event listener
  useEffect(() => {
    console.log(`[useConditionEvents] Setting up conditions-updated listener for message ${messageId}`);
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    
    return () => {
      console.log(`[useConditionEvents] Removing conditions-updated listener for message ${messageId}`);
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [handleConditionsUpdated, messageId]);
}
