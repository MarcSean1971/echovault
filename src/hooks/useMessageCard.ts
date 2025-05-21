
import { useState, useEffect, useCallback } from "react";
import { useMessageCondition } from "@/hooks/message-condition";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

/**
 * Custom hook to handle message card state and actions
 */
export function useMessageCard(messageId: string) {
  // Track local force refresh state
  const [forceRefresh, setForceRefresh] = useState(false);

  // Get condition status and data with potential forced refresh
  const { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    refreshCounter, 
    setRefreshCounter,
    invalidateCache
  } = useMessageCondition(messageId, forceRefresh);
  
  // Reset force refresh after it's been used
  useEffect(() => {
    if (forceRefresh) {
      setForceRefresh(false);
    }
  }, [forceRefresh]);
  
  // Import the action handlers from the hook
  const { handleArmMessage, handleDisarmMessage, isLoading: actionIsLoading } = useMessageCardActions();
  
  // Action handlers with refresh and cache invalidation
  const onArmMessage = useCallback(async () => {
    if (!condition) {
      console.log("[MessageCard] Cannot arm message: no condition");
      return null;
    }
    
    console.log(`[MessageCard] Fast arming message ${messageId} with condition ${condition.id}`);
    
    // Invalidate cache before arming to ensure fresh data
    invalidateCache();
    
    // Arm the message
    const result = await handleArmMessage(condition.id);
    
    // Force refresh the component after arming
    setForceRefresh(true);
    
    // Increment refresh counter to force timer re-render
    setRefreshCounter(prev => prev + 1);
    
    return result;
  }, [condition, messageId, invalidateCache, handleArmMessage, setRefreshCounter]);
  
  const onDisarmMessage = useCallback(async () => {
    if (!condition) {
      console.log("[MessageCard] Cannot disarm message: no condition");
      return;
    }
    
    console.log(`[MessageCard] Disarming message ${messageId} with condition ${condition.id}`);
    
    // Invalidate cache before disarming to ensure fresh data
    invalidateCache();
    
    // Disarm the message
    await handleDisarmMessage(condition.id);
    
    // Force refresh the component after disarming
    setForceRefresh(true);
    
    // Increment refresh counter to force timer re-render
    setRefreshCounter(prev => prev + 1);
  }, [condition, messageId, invalidateCache, handleDisarmMessage, setRefreshCounter]);

  // Listen for targeted update events
  useEffect(() => {
    const handleTargetedUpdate = (event: Event) => {
      if (event instanceof CustomEvent) {
        const detail = event.detail || {};
        
        // Check if this event targets the current message
        if (detail.messageId === messageId) {
          console.log(`[MessageCard] Received targeted update for message ${messageId}, action: ${detail.action}`);
          
          // Invalidate cache and force refresh
          invalidateCache();
          setForceRefresh(true);
        }
      }
    };
    
    // Listen for targeted update events
    window.addEventListener('message-targeted-update', handleTargetedUpdate);
    
    return () => {
      window.removeEventListener('message-targeted-update', handleTargetedUpdate);
    };
  }, [messageId, invalidateCache]);

  // Listen for reminder generation request events
  useEffect(() => {
    const handleGenerateReminders = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { messageId: eventMessageId, conditionId } = event.detail || {};
        
        if (eventMessageId === messageId && conditionId) {
          console.log(`[MessageCard] Background reminder generation for message ${eventMessageId}`);
          // Generate reminders in the background
          ensureReminderSchedule(conditionId, false).catch(error => { // Fix: Pass boolean instead of string
            console.error("[MessageCard] Error in background reminder generation:", error);
          });
        }
      }
    };
    
    window.addEventListener('generate-message-reminders', handleGenerateReminders);
    return () => {
      window.removeEventListener('generate-message-reminders', handleGenerateReminders);
    };
  }, [messageId]);

  return {
    isArmed,
    deadline,
    condition,
    isPanicTrigger,
    refreshCounter,
    actionIsLoading,
    onArmMessage,
    onDisarmMessage
  };
}
