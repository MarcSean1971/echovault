
import { useState, useEffect, useCallback } from "react";
import { MessageCondition } from "@/types/message";
import { useConditionFetcher } from "./useConditionFetcher";
import { useConditionEvents } from "./useConditionEvents";
import { invalidateConditionCache } from "./conditionCache";

/**
 * Main hook for managing message condition state
 */
export function useMessageCondition(messageId: string, forceRefresh: boolean = false) {
  // State
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [condition, setCondition] = useState<MessageCondition | null>(null);
  const [isPanicTrigger, setIsPanicTrigger] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Get condition data fetching functions
  const { fetchConditionData, fetchDeadline, isLoading } = useConditionFetcher();
  
  // Load condition and update state
  const loadConditionData = useCallback(async () => {
    if (!messageId) return;
    
    const { condition: newCondition, isArmed: newIsArmed, isPanicTrigger: newIsPanicTrigger } = 
      await fetchConditionData(messageId, forceRefresh);
    
    setCondition(newCondition);
    setIsArmed(newIsArmed);
    setIsPanicTrigger(newIsPanicTrigger);
    
    // Get deadline if message is armed
    if (newCondition && newIsArmed) {
      const deadlineDate = await fetchDeadline(newCondition.id);
      setDeadline(deadlineDate);
    }
  }, [messageId, forceRefresh, fetchConditionData, fetchDeadline]);
  
  // Initialize data on mount or when messageId/forceRefresh changes
  useEffect(() => {
    loadConditionData();
  }, [loadConditionData]);
  
  // Increment refresh counter
  const incrementRefreshCounter = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);
  
  // Set up event handlers
  useConditionEvents(
    messageId,
    loadConditionData,
    () => invalidateConditionCache(messageId),
    incrementRefreshCounter
  );
  
  // Create an invalidator function specific to this message
  const invalidateCache = useCallback(() => {
    invalidateConditionCache(messageId);
  }, [messageId]);
  
  return { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    transcription,
    refreshCounter,
    isLoading,
    setRefreshCounter,
    invalidateCache
  };
}
