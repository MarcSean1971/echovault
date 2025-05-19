
import { useState, useEffect, useMemo } from "react";
import { MessageCondition } from "@/types/message";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";

// Cache for conditions to reduce redundant API calls
const conditionCache = new Map<string, {
  condition: MessageCondition | null,
  timestamp: number
}>();

// Cache TTL in milliseconds (reduced from 10 seconds to 2 seconds for more responsive updates)
const CACHE_TTL = 2000;

// Function to invalidate cache for a specific message ID or all messages
export function invalidateConditionCache(messageId?: string) {
  if (messageId) {
    console.log(`[useMessageCondition] Invalidating cache for message ${messageId}`);
    conditionCache.delete(messageId);
  } else {
    console.log('[useMessageCondition] Invalidating all condition caches');
    conditionCache.clear();
  }
}

export function useMessageCondition(messageId: string, forceRefresh: boolean = false) {
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [condition, setCondition] = useState<MessageCondition | null>(null);
  const [isPanicTrigger, setIsPanicTrigger] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load message condition status with improved caching
  useEffect(() => {
    // Skip loading if we don't have a messageId
    if (!messageId) {
      setIsLoading(false);
      return;
    }

    // Check if we have a recent cached version first (and not forcing refresh)
    const cachedData = conditionCache.get(messageId);
    const now = Date.now();
    
    if (!forceRefresh && cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      const cachedCondition = cachedData.condition;
      if (cachedCondition) {
        console.log(`[MessageCondition] Using cached condition for message ${messageId}`);
        setCondition(cachedCondition);
        setIsArmed(cachedCondition.active);
        setIsPanicTrigger(cachedCondition.condition_type === 'panic_trigger');
        setIsLoading(false);
        
        // Even with cache hit, get deadline if needed
        if (cachedCondition.active) {
          getMessageDeadline(cachedCondition.id)
            .then(deadlineDate => {
              if (deadlineDate) {
                setDeadline(new Date(deadlineDate.getTime()));
              } else {
                setDeadline(null);
              }
            })
            .catch(err => console.error("Error getting deadline:", err));
        }
        
        return;
      }
    }
    
    // If no valid cache, load from API
    setIsLoading(true);
    const loadConditionStatus = async () => {
      try {
        console.log(`[MessageCard] Loading condition for message ID: ${messageId}`);
        const messageCondition = await getConditionByMessageId(messageId);
        
        // Cache the result
        conditionCache.set(messageId, {
          condition: messageCondition,
          timestamp: Date.now()
        });
        
        if (messageCondition) {
          console.log(`[MessageCard] Got condition ID: ${messageCondition.id}, active: ${messageCondition.active}`);
          setCondition(messageCondition);
          setIsArmed(messageCondition.active);
          setIsPanicTrigger(messageCondition.condition_type === 'panic_trigger');
          
          // Get deadline if message is armed
          if (messageCondition.active) {
            const deadlineDate = await getMessageDeadline(messageCondition.id);
            // Create a new Date object to ensure React detects the change
            if (deadlineDate) {
              console.log(`[MessageCard] Got deadline: ${deadlineDate.toISOString()}`);
              setDeadline(new Date(deadlineDate.getTime()));
            } else {
              setDeadline(null);
            }
          }
        }
      } catch (error) {
        console.error("Error loading message condition:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConditionStatus();
    
    // Also reload when conditions-updated event is received
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        const detail = event.detail || {};
        const eventMessageId = detail.messageId;
        
        // If event is for this specific message or it's a global update
        if (!eventMessageId || eventMessageId === messageId) {
          console.log(`[MessageCard ${messageId}] Received conditions-updated event, reloading`);
          
          // Clear cache for this message
          invalidateConditionCache(messageId);
          
          // Reload data
          loadConditionStatus();
          
          // Increment refresh counter to force re-render of timer
          setRefreshCounter(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [messageId, refreshCounter, forceRefresh]);
  
  return { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    transcription,
    refreshCounter,
    isLoading,
    setRefreshCounter,
    invalidateCache: () => invalidateConditionCache(messageId)
  };
}
