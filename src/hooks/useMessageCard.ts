
import { useState, useEffect, useCallback } from "react";
import { useMessageCondition } from "@/hooks/message-condition";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

/**
 * ENHANCED: Custom hook to handle message card state with comprehensive delivery completion reset
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

  // ENHANCED: Comprehensive delivery completion event handling
  useEffect(() => {
    const handleDeliveryComplete = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const detail = event.detail || {};
      
      // Check if this event targets the current message
      if (detail.messageId === messageId) {
        console.log(`[MessageCard] DELIVERY COMPLETION detected for message ${messageId}:`, detail);
        
        // IMMEDIATE and comprehensive cache invalidation
        invalidateCache();
        
        // Multiple aggressive refresh cycles for delivery completion
        setForceRefresh(true);
        setRefreshCounter(prev => prev + 1);
        
        // Immediate secondary refresh
        setTimeout(() => {
          console.log(`[MessageCard] Secondary delivery completion refresh for message ${messageId}`);
          invalidateCache();
          setForceRefresh(true);
          setRefreshCounter(prev => prev + 1);
        }, 100);
        
        // Final verification refresh
        setTimeout(() => {
          console.log(`[MessageCard] Final delivery completion verification for message ${messageId}`);
          setRefreshCounter(prev => prev + 1);
        }, 1000);
      }
    };
    
    // Listen for multiple delivery completion event types
    window.addEventListener('message-delivery-complete', handleDeliveryComplete);
    window.addEventListener('conditions-updated', handleDeliveryComplete);
    window.addEventListener('message-reminder-updated', handleDeliveryComplete);
    
    return () => {
      window.removeEventListener('message-delivery-complete', handleDeliveryComplete);
      window.removeEventListener('conditions-updated', handleDeliveryComplete);
      window.removeEventListener('message-reminder-updated', handleDeliveryComplete);
    };
  }, [messageId, invalidateCache, setRefreshCounter]);

  // ENHANCED: Comprehensive reminder delivery and status change handling
  useEffect(() => {
    const handleReminderStatusChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const detail = event.detail || {};
      
      // Handle events that affect this message
      if (detail.messageId === messageId) {
        console.log(`[MessageCard] Reminder status change for message ${messageId}:`, detail);
        
        // Handle different types of status changes
        if (detail.action === 'delivery-complete' || detail.reminderType === 'final_delivery') {
          console.log(`[MessageCard] FINAL DELIVERY completed for message ${messageId} - comprehensive reset`);
          
          // Immediate aggressive reset for final deliveries
          invalidateCache();
          setForceRefresh(true);
          setRefreshCounter(prev => prev + 1);
          
          // Additional refresh after brief delay
          setTimeout(() => {
            invalidateCache();
            setForceRefresh(true);
            setRefreshCounter(prev => prev + 1);
          }, 200);
          
        } else if (detail.action === 'reminder-sent' || detail.action === 'reminder-delivered') {
          console.log(`[MessageCard] Reminder sent/delivered for message ${messageId} - standard refresh`);
          
          // Standard refresh for check-in reminders
          invalidateCache();
          setForceRefresh(true);
          setRefreshCounter(prev => prev + 1);
        }
      }
    };
    
    // Listen for various reminder status change events
    window.addEventListener('conditions-updated', handleReminderStatusChange);
    window.addEventListener('message-reminder-updated', handleReminderStatusChange);
    window.addEventListener('message-targeted-update', handleReminderStatusChange);
    
    return () => {
      window.removeEventListener('conditions-updated', handleReminderStatusChange);
      window.removeEventListener('message-reminder-updated', handleReminderStatusChange);
      window.removeEventListener('message-targeted-update', handleReminderStatusChange);
    };
  }, [messageId, invalidateCache, setRefreshCounter]);

  // ENHANCED: WhatsApp check-in event handling with immediate priority
  useEffect(() => {
    const handleWhatsAppCheckIn = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const detail = event.detail || {};
      
      // Check if this event targets the current message
      if (detail.messageId === messageId) {
        console.log(`[MessageCard] Received update for message ${messageId}:`, detail);
        
        // PRIORITY: Handle final delivery completion with maximum priority
        if (detail.action === 'delivery-complete' || detail.reminderType === 'final_delivery') {
          console.log(`[MessageCard] MAXIMUM PRIORITY: Final delivery for message ${messageId}`);
          
          // Immediate triple refresh for final deliveries
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              invalidateCache();
              setForceRefresh(true);
              setRefreshCounter(prev => prev + 1);
            }, i * 50);
          }
          
          return; // Don't process as regular update
        }
        
        // IMMEDIATE handling for WhatsApp check-ins
        if (detail.action === 'check-in' && (detail.source === 'whatsapp' || detail.source === 'whatsapp-realtime')) {
          console.log(`[MessageCard] IMMEDIATE WhatsApp check-in for message ${messageId}`);
          
          // Immediate cache invalidation and refresh
          invalidateCache();
          setForceRefresh(true);
          setRefreshCounter(prev => prev + 1);
          
          // Quick follow-up refresh
          setTimeout(() => {
            setForceRefresh(true);
            setRefreshCounter(prev => prev + 1);
          }, 100);
          
        } else {
          // Regular handling for other events
          invalidateCache();
          setForceRefresh(true);
          setRefreshCounter(prev => prev + 1);
        }
      }
    };
    
    // Listen for targeted updates and general condition updates
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
