import { useEffect, useCallback, useRef } from "react";

/**
 * FIXED: Immediate hook to manage condition-related events with fast WhatsApp check-in handling
 */
export function useConditionEvents(
  messageId: string,
  refreshData: () => void,
  invalidateCache: () => void,
  incrementRefreshCounter: () => void
) {
  const listenerRef = useRef<((event: Event) => void) | null>(null);
  const messageIdRef = useRef(messageId);

  /**
   * FIXED: Handle conditions-updated event with immediate WhatsApp check-in updates
   */
  const handleConditionsUpdated = useCallback((event: Event) => {
    if (event instanceof CustomEvent) {
      const detail = event.detail || {};
      const eventMessageId = detail.messageId;
      const action = detail.action;
      const source = detail.source;
      const enhanced = detail.enhanced;
      
      // If event is for this specific message or it's a global update
      if (!eventMessageId || eventMessageId === messageIdRef.current) {
        console.log(`[useConditionEvents ${messageIdRef.current}] Received event:`, 
          'action:', action || 'update', 
          'source:', source || 'unknown',
          'messageId:', eventMessageId || 'global',
          'enhanced:', enhanced || false
        );
        
        // FIXED: WhatsApp check-ins get IMMEDIATE handling
        if (action === 'check-in' && (source === 'whatsapp' || source === 'whatsapp-realtime')) {
          console.log(`[useConditionEvents ${messageIdRef.current}] WhatsApp check-in - IMMEDIATE refresh`);
          
          // Immediate cache clearing and refresh
          invalidateCache();
          refreshData();
          incrementRefreshCounter();
          
        } else {
          // Regular handling for other events
          invalidateCache();
          refreshData();
          incrementRefreshCounter();
        }
      }
    }
  }, [refreshData, invalidateCache, incrementRefreshCounter]);

  // Set up event listener only once and keep it stable
  useEffect(() => {
    console.log(`[useConditionEvents] Setting up IMMEDIATE listener for message ${messageId}`);
    
    // Update the messageId ref
    messageIdRef.current = messageId;
    
    // Remove any existing listener
    if (listenerRef.current) {
      window.removeEventListener('conditions-updated', listenerRef.current);
    }
    
    // Create and store the stable listener
    listenerRef.current = handleConditionsUpdated;
    window.addEventListener('conditions-updated', listenerRef.current);
    
    return () => {
      if (listenerRef.current) {
        console.log(`[useConditionEvents] Removing IMMEDIATE listener for message ${messageId}`);
        window.removeEventListener('conditions-updated', listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [messageId]); // Only messageId dependency to avoid listener recreation

  // Update the callback reference without recreating listener
  useEffect(() => {
    if (listenerRef.current) {
      listenerRef.current = handleConditionsUpdated;
    }
  }, [handleConditionsUpdated]);
}
