
import { useState, useCallback } from "react";
import { MessageCondition } from "@/types/message";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";
import { getValidCachedCondition, setCachedCondition } from "./conditionCache";

/**
 * Hook for fetching condition data from the API
 */
export function useConditionFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Load condition data from API or cache
   */
  const fetchConditionData = useCallback(async (
    messageId: string,
    forceRefresh: boolean = false
  ): Promise<{
    condition: MessageCondition | null,
    isArmed: boolean,
    isPanicTrigger: boolean
  }> => {
    // Check if we have a recent cached version first (and not forcing refresh)
    const cachedData = !forceRefresh ? getValidCachedCondition(messageId) : undefined;
    
    if (cachedData) {
      const cachedCondition = cachedData.condition;
      if (cachedCondition) {
        return {
          condition: cachedCondition,
          isArmed: cachedCondition.active,
          isPanicTrigger: cachedCondition.condition_type === 'panic_trigger'
        };
      }
    }
    
    // If no valid cache, load from API
    setIsLoading(true);
    try {
      console.log(`[MessageCard] Loading condition for message ID: ${messageId}`);
      const messageCondition = await getConditionByMessageId(messageId);
      
      // Cache the result
      setCachedCondition(messageId, messageCondition);
      
      if (messageCondition) {
        console.log(`[MessageCard] Got condition ID: ${messageCondition.id}, active: ${messageCondition.active}`);
        return {
          condition: messageCondition,
          isArmed: messageCondition.active,
          isPanicTrigger: messageCondition.condition_type === 'panic_trigger'
        };
      }
      
      return { condition: null, isArmed: false, isPanicTrigger: false };
    } catch (error) {
      console.error("Error loading message condition:", error);
      return { condition: null, isArmed: false, isPanicTrigger: false };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Fetch deadline for an active condition
   */
  const fetchDeadline = useCallback(async (conditionId: string): Promise<Date | null> => {
    try {
      const deadlineDate = await getMessageDeadline(conditionId);
      if (deadlineDate) {
        console.log(`[MessageCard] Got deadline: ${deadlineDate.toISOString()}`);
        return new Date(deadlineDate.getTime());
      }
      return null;
    } catch (error) {
      console.error("Error getting deadline:", error);
      return null;
    }
  }, []);
  
  return { fetchConditionData, fetchDeadline, isLoading };
}
