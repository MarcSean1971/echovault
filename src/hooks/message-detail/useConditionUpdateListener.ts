
import { useEffect } from "react";

/**
 * Hook to listen for condition updates and trigger refreshes
 */
export function useConditionUpdateListener(
  messageId: string | undefined,
  refreshConditionData: (messageId: string | undefined) => Promise<void>,
  invalidateConditionsCache: () => void,
  refreshTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setRefreshCount: (cb: (prev: number) => number) => void
) {
  // Optimized listener for condition updates with debouncing
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log(`[useMessageDetail] Received conditions-updated event, details:`, event.detail);
        
        // Clear existing timeout if there is one
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Debounce the refresh to avoid multiple rapid refreshes
        refreshTimeoutRef.current = setTimeout(() => {
          console.log(`[useMessageDetail] Debounced refresh for message ${messageId}`);
          
          // Clear any cached data
          if (messageId) {
            invalidateConditionsCache();
          }
          
          // Refresh condition data to get the latest information
          refreshConditionData(messageId);
          
          // Increment counter to force downstream components to re-render
          // But only do it once per group of events
          setRefreshCount(prev => prev + 1);
          
          // Clear the timeout ref
          refreshTimeoutRef.current = null;
        }, 300); // 300ms debounce time
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      // Clear any pending timeout when component unmounts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [messageId, refreshConditionData, refreshTimeoutRef, setRefreshCount, invalidateConditionsCache]);
}
