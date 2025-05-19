
import { invalidateConditionCache } from "@/hooks/useMessageCondition";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

/**
 * Hook for handling condition-related updates and events
 */
export function useConditionUpdates() {
  const { refreshConditions } = useConditionRefresh();
  
  const invalidateCache = (messageId?: string) => {
    if (messageId) {
      invalidateConditionCache(messageId);
    }
  };
  
  const emitOptimisticUpdate = (conditionId: string, messageId?: string, action: 'arm' | 'disarm' = 'arm') => {
    window.dispatchEvent(new CustomEvent('conditions-updated', { 
      detail: { 
        conditionId,
        messageId,
        action,
        optimistic: true,
        timestamp: new Date().toISOString()
      }
    }));
  };
  
  const emitConfirmedUpdate = (conditionId: string, messageId?: string, action: 'arm' | 'disarm' = 'arm', deadline?: string) => {
    const eventDetail: any = { 
      conditionId,
      messageId,
      action,
      optimistic: false,
      timestamp: new Date().toISOString() 
    };
    
    if (deadline) {
      eventDetail.deadline = deadline;
    }
    
    window.dispatchEvent(new CustomEvent('conditions-updated', { detail: eventDetail }));
  };
  
  const requestReminderGeneration = (messageId: string, conditionId: string) => {
    const event = new CustomEvent('generate-message-reminders', { 
      detail: { messageId, conditionId }
    });
    window.dispatchEvent(event);
  };
  
  return {
    refreshConditions,
    invalidateCache,
    emitOptimisticUpdate,
    emitConfirmedUpdate,
    requestReminderGeneration
  };
}
