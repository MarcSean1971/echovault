
import { useState, useEffect, useCallback } from "react";
import { useMessageCondition } from "@/hooks/message-condition";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

/**
 * FIXED: Custom hook to handle message card state with enhanced WhatsApp check-in handling
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
    
    console.log(`[MessageCard] Arming message ${messageId}`);
    invalidateCache();
    const result = await handleArmMessage(condition.id);
    setForceRefresh(true);
    setRefreshCounter(prev => prev + 1);
    return result;
  }, [condition, messageId, invalidateCache, handleArmMessage, setRefreshCounter]);
  
  const onDisarmMessage = useCallback(async () => {
    if (!condition) {
      console.log("[MessageCard] Cannot disarm message: no condition");
      return;
    }
    
    console.log(`[MessageCard] Disarming message ${messageId}`);
    invalidateCache();
    await handleDisarmMessage(condition.id);
    setForceRefresh(true);
    setRefreshCounter(prev => prev + 1);
  }, [condition, messageId, invalidateCache, handleDisarmMessage, setRefreshCounter]);

  // ENHANCED: Optimized WhatsApp check-in event handling with proper delays
  useEffect(() => {
    const handleWhatsAppCheckIn = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const detail = event.detail || {};
      
      // Check if this event targets the current message
      if (detail.messageId === messageId) {
        console.log(`[MessageCard] Received update for message ${messageId}:`, detail);
        
        // ENHANCED: Special handling for WhatsApp check-ins with delay
        if (detail.action === 'check-in' && (detail.source === 'whatsapp' || detail.source === 'whatsapp-realtime')) {
          console.log(`[MessageCard] WhatsApp check-in detected for message ${messageId} - ENHANCED refresh with delay`);
          
          // CRITICAL FIX: Add delay to ensure DB propagation is complete
          setTimeout(() => {
            console.log(`[MessageCard] Executing delayed refresh for WhatsApp check-in on message ${messageId}`);
            
            // Clear cache completely and force immediate refresh
            invalidateCache();
            setForceRefresh(true);
            setRefreshCounter(prev => prev + 1);
            
            // Force another refresh after a short delay to ensure deadline recalculation
            setTimeout(() => {
              console.log(`[MessageCard] Secondary refresh for deadline recalculation on message ${messageId}`);
              setForceRefresh(true);
              setRefreshCounter(prev => prev + 1);
            }, 300);
            
          }, 800); // Increased delay to 800ms to ensure DB propagation
          
        } else {
          // Regular handling for other events
          invalidateCache();
          setForceRefresh(true);
        }
      }
    };
    
    // Listen for both targeted updates and general condition updates
    window.addEventListener('message-targeted-update', handleWhatsAppCheckIn);
    window.addEventListener('conditions-updated', handleWhatsAppCheckIn);
    
    return () => {
      window.removeEventListener('message-targeted-update', handleWhatsAppCheckIn);
      window.removeEventListener('conditions-updated', handleWhatsAppCheckIn);
    };
  }, [messageId, invalidateCache, setRefreshCounter]);

  // Background reminder generation
  useEffect(() => {
    const handleGenerateReminders = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { messageId: eventMessageId, conditionId } = event.detail || {};
        
        if (eventMessageId === messageId && conditionId) {
          console.log(`[MessageCard] Background reminder generation for message ${eventMessageId}`);
          ensureReminderSchedule(conditionId, false).catch(error => {
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
