
import { useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageDetailState } from "./useMessageDetailState";
import { useFetchMessageData } from "./useFetchMessageData";
import { useFetchConditionData } from "./useFetchConditionData";
import { useRefreshConditionData } from "./useRefreshConditionData";
import { useConditionUpdateListener } from "./useConditionUpdateListener";
import { UseMessageDetailOptions, MessageDetailState, MessageDetailActions } from "./types";

/**
 * Custom hook for loading message details and conditions with optimized parallel loading
 */
export function useMessageDetail(
  messageId: string | undefined, 
  onError: () => void
): MessageDetailState & MessageDetailActions {
  const { userId } = useAuth();
  const { 
    message, setMessage,
    isLoading, setIsLoading,
    isArmed, setIsArmed,
    deadline, setDeadline,
    conditionId, setConditionId,
    condition, setCondition,
    recipients, setRecipients,
    lastCheckIn, setLastCheckIn,
    refreshCount, setRefreshCount,
    hasAttemptedFetch, setHasAttemptedFetch,
    lastRefreshTimeRef, refreshTimeoutRef
  } = useMessageDetailState();

  // Import data fetching hooks
  const { fetchMessageData } = useFetchMessageData();
  const { fetchConditionData, fetchDeadline } = useFetchConditionData();
  const { refreshConditionData, invalidateConditionsCache } = useRefreshConditionData(
    fetchConditionData, 
    fetchDeadline,
    lastRefreshTimeRef,
    setCondition,
    setIsArmed,
    setConditionId,
    setLastCheckIn,
    setDeadline,
    setRecipients
  );

  // Main fetch function - now optimized to load data in parallel
  const fetchData = useCallback(async () => {
    if (!userId || !messageId || hasAttemptedFetch) return;
    
    setIsLoading(true);
    setHasAttemptedFetch(true);
    
    try {
      // Start fetching message and condition data in parallel
      const messagePromise = fetchMessageData(messageId, userId);
      const conditionPromise = fetchConditionData(messageId);
      
      // First, get the message data so we can show the basic UI right away
      try {
        const messageData = await messagePromise;
        setMessage(messageData);
        console.log(`[useMessageDetail] Message data set, UI can now render`);
        
        // We can lower the loading state once we have the basic message
        // This allows the UI to show the message while still loading other data
        setIsLoading(false);
      } catch (messageError) {
        console.error("Error fetching message:", messageError);
        toast({
          title: "Error",
          description: "Failed to load the message",
          variant: "destructive"
        });
        onError();
        return;
      }
      
      // Now get the condition data
      try {
        const conditionData = await conditionPromise;
        
        if (conditionData) {
          console.log(`[useMessageDetail] Processing condition data`);
          setCondition(conditionData);
          setIsArmed(conditionData.active);
          setConditionId(conditionData.id);
          setLastCheckIn(conditionData.last_checked || null);
          
          // Set recipients from condition data if available
          if (conditionData.recipients && Array.isArray(conditionData.recipients)) {
            setRecipients(conditionData.recipients);
          }
          
          // Finally, if the condition is active, fetch the deadline
          if (conditionData.active) {
            try {
              console.log(`[useMessageDetail] Fetching deadline for active condition`);
              const deadlineDate = await fetchDeadline(conditionData.id);
              if (deadlineDate) {
                console.log(`[useMessageDetail] Setting deadline: ${deadlineDate.toISOString()}`);
                setDeadline(new Date(deadlineDate.getTime()));
              }
            } catch (deadlineError) {
              console.error("Error fetching deadline:", deadlineError);
              // Non-critical error, UI can still function
            }
          }
        } else {
          console.log(`[useMessageDetail] No condition data found`);
        }
      } catch (conditionError) {
        console.error("Error fetching condition:", conditionError);
        // Non-critical error, UI can still show the message
      }
      
    } catch (error: any) {
      console.error("Fatal error in fetchData:", error);
      toast({
        title: "Error",
        description: "Failed to load message details",
        variant: "destructive"
      });
      onError();
    } finally {
      // Ensure loading is set to false in all cases
      setIsLoading(false);
    }
  }, [userId, messageId, hasAttemptedFetch, fetchMessageData, fetchConditionData, fetchDeadline, onError, 
    setMessage, setIsLoading, setCondition, setIsArmed, setConditionId, setLastCheckIn, 
    setRecipients, setDeadline, setHasAttemptedFetch]);

  // Use effect with the memoized fetch function
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add condition update listener
  useConditionUpdateListener(
    messageId,
    refreshConditionData,
    invalidateConditionsCache,
    refreshTimeoutRef,
    setRefreshCount
  );

  return {
    message,
    isLoading,
    isArmed,
    deadline,
    conditionId,
    condition,
    recipients,
    setIsArmed,
    lastCheckIn,
    refreshCount
  };
}
