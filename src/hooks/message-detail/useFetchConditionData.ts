
import { useCallback } from "react";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";

/**
 * Hook for fetching condition and deadline data
 */
export function useFetchConditionData() {
  // Optimized function to fetch condition data
  const fetchConditionData = useCallback(async (messageId: string) => {
    try {
      console.log(`[useMessageDetail] Fetching condition data for message ${messageId}`);
      const conditionData = await getConditionByMessageId(messageId);
      
      if (conditionData) {
        console.log(`[useMessageDetail] Condition data retrieved:`, conditionData);
        return conditionData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching condition data:", error);
      return null;
    }
  }, []);

  // Function to fetch deadline for the message
  const fetchDeadline = useCallback(async (condId: string) => {
    if (!condId) return null;
    
    try {
      console.log(`[useMessageDetail] Fetching new deadline for condition ${condId}`);
      const deadlineDate = await getMessageDeadline(condId);
      console.log(`[useMessageDetail] New deadline fetched:`, deadlineDate);
      return deadlineDate;
    } catch (error) {
      console.error("Error fetching deadline:", error);
      return null;
    }
  }, []);

  return { fetchConditionData, fetchDeadline };
}
