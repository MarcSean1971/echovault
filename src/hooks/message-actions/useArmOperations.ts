
import { supabase } from "@/integrations/supabase/client";
import { useActionToasts } from "./useActionToasts";
import { useConditionUpdates } from "./useConditionUpdates";
import { createReminderSchedule } from "@/services/reminders/simpleReminderService";

/**
 * Hook for handling arming message operations
 */
export function useArmOperations() {
  const { 
    showArmSuccess, 
    showArmError 
  } = useActionToasts();
  
  const {
    invalidateCache,
    emitOptimisticUpdate,
    emitConfirmedUpdate,
    requestReminderGeneration,
    refreshConditions
  } = useConditionUpdates();
  
  const armMessage = async (conditionId: string): Promise<Date | null> => {
    if (!conditionId) {
      console.log("[useArmOperations] Cannot arm message: no conditionId provided");
      return null;
    }
    
    console.log(`[useArmOperations] Arming message with condition ${conditionId}`);
    
    try {
      // First, get the current condition to extract messageId for later use
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("message_id, condition_type")
        .eq("id", conditionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const messageId = currentCondition?.message_id;
      const conditionType = currentCondition?.condition_type;
      
      // Immediately invalidate cache to force a refresh on next query
      if (messageId) {
        invalidateCache(messageId);
      }
      
      // Emit an optimistic update event immediately
      emitOptimisticUpdate(conditionId, messageId, 'arm');
      
      // Direct database operation for faster arming - avoids processing content
      const { data, error } = await supabase
        .from("message_conditions")
        .update({ 
          active: true,
          last_checked: new Date().toISOString() 
        })
        .eq("id", conditionId)
        .select("id, message_id")
        .single();
      
      if (error) {
        throw error;
      }
      
      // Get message ID for UI feedback and reminders
      const actualMessageId = data.message_id;
      
      // Create reminder schedule using the simplified service
      await createReminderSchedule({
        messageId: actualMessageId,
        conditionId: conditionId,
        conditionType: conditionType,
        triggerDate: undefined,
        lastChecked: new Date().toISOString(),
        hoursThreshold: undefined,
        minutesThreshold: undefined,
        reminderHours: [24, 12, 6, 1] // Default reminder schedule
      });
      
      // Get deadline for immediate UI feedback
      const { data: condition } = await supabase
        .from("message_conditions")
        .select("*")
        .eq("id", conditionId)
        .single();
        
      // Calculate deadline
      let deadlineDate: Date | null = null;
      if (condition) {
        if (condition.condition_type === "scheduled" && condition.trigger_date) {
          deadlineDate = new Date(condition.trigger_date);
        } else if (condition.hours_threshold) {
          const hoursInMs = condition.hours_threshold * 60 * 60 * 1000;
          const minutesInMs = (condition.minutes_threshold || 0) * 60 * 1000;
          deadlineDate = new Date(Date.now() + hoursInMs + minutesInMs);
        }
      }
      
      console.log(`[useArmOperations] Arm successful, deadline: ${deadlineDate?.toISOString() || 'unknown'}`);
      
      // Show success toast
      showArmSuccess();
      
      // Fire a confirmed update event now that we have real data
      emitConfirmedUpdate(
        conditionId, 
        actualMessageId, 
        'arm',
        deadlineDate?.toISOString()
      );
      
      // NEW: Fire a specific event for message cards to handle
      window.dispatchEvent(new CustomEvent('message-reminder-updated', { 
        detail: { 
          messageId: actualMessageId,
          conditionId,
          action: 'arm',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Fire a background event to handle reminder generation without blocking UI
      setTimeout(() => {
        requestReminderGeneration(actualMessageId, conditionId);
      }, 100);
      
      // Refresh conditions data to update UI components with the latest state
      await refreshConditions();
      
      return deadlineDate;
    } catch (error) {
      console.error("[useArmOperations] Error arming message:", error);
      showArmError();
      return null;
    }
  };
  
  return { armMessage };
}
