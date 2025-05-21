
import { useCallback } from "react";
import { invalidateConditionsCache } from "@/services/messages/conditions/operations/fetch-operations";

/**
 * Hook for refreshing condition data with debouncing
 */
export function useRefreshConditionData(
  fetchConditionData: (messageId: string) => Promise<any>,
  fetchDeadline: (condId: string) => Promise<Date | null>,
  lastRefreshTimeRef: React.MutableRefObject<number>,
  setCondition: (condition: any) => void,
  setIsArmed: (isArmed: boolean) => void,
  setConditionId: (conditionId: string | null) => void,
  setLastCheckIn: (lastCheckIn: string | null) => void,
  setDeadline: (deadline: Date | null) => void,
  setRecipients: (recipients: any[]) => void
) {
  // Function to refresh condition and deadline data with debouncing
  const refreshConditionData = useCallback(async (messageId: string | undefined) => {
    if (!messageId) return;
    
    // Check if we've refreshed recently (within last 2 seconds)
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      console.log('[useMessageDetail] Skipping refresh, too soon after last refresh');
      return;
    }
    
    // Update last refresh time
    lastRefreshTimeRef.current = now;
    
    try {
      console.log(`[useMessageDetail] Refreshing condition data for message ${messageId}`);
      const conditionData = await fetchConditionData(messageId);
      
      if (conditionData) {
        setCondition(conditionData);
        setIsArmed(conditionData.active);
        setConditionId(conditionData.id);
        setLastCheckIn(conditionData.last_checked || null);
        
        if (conditionData.active) {
          const newDeadline = await fetchDeadline(conditionData.id);
          if (newDeadline) {
            console.log(`[useMessageDetail] Setting new deadline: ${newDeadline.toISOString()}`);
            // Create a new Date object to ensure React detects the change
            setDeadline(new Date(newDeadline.getTime()));
          }
        } else {
          setDeadline(null);
        }
        
        // Set recipients from condition data if available
        if (conditionData.recipients && Array.isArray(conditionData.recipients)) {
          setRecipients(conditionData.recipients);
        }
      }
    } catch (error) {
      console.error("Error refreshing condition data:", error);
    }
  }, [fetchConditionData, fetchDeadline, setCondition, setIsArmed, setConditionId, setLastCheckIn, setDeadline, setRecipients, lastRefreshTimeRef]);
  
  return { refreshConditionData, invalidateConditionsCache };
}
