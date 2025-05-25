
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
      // First, get the current condition to extract all necessary data
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("*")
        .eq("id", conditionId)
        .single();
        
      if (fetchError) {
        console.error("[useArmOperations] Error fetching condition:", fetchError);
        throw fetchError;
      }
      
      if (!currentCondition) {
        throw new Error("Condition not found");
      }
      
      const messageId = currentCondition.message_id;
      const conditionType = currentCondition.condition_type;
      
      // Immediately invalidate cache to force a refresh on next query
      if (messageId) {
        invalidateCache(messageId);
      }
      
      // Emit an optimistic update event immediately
      emitOptimisticUpdate(conditionId, messageId, 'arm');
      
      // Update the condition to be active with current timestamp
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("message_conditions")
        .update({ 
          active: true,
          last_checked: now
        })
        .eq("id", conditionId)
        .select("*")
        .single();
      
      if (error) {
        console.error("[useArmOperations] Error updating condition:", error);
        throw error;
      }
      
      console.log(`[useArmOperations] Successfully armed condition, creating reminder schedule...`);
      
      // Create reminder schedule using the COMPLETE condition data
      const reminderSuccess = await createReminderSchedule({
        messageId: messageId,
        conditionId: conditionId,
        conditionType: conditionType,
        triggerDate: currentCondition.trigger_date,
        lastChecked: now, // Use the timestamp we just set
        hoursThreshold: currentCondition.hours_threshold,
        minutesThreshold: currentCondition.minutes_threshold,
        reminderHours: currentCondition.reminder_hours || [24, 12, 6, 1] // Default reminder schedule
      });
      
      if (!reminderSuccess) {
        console.warn(`[useArmOperations] Failed to create reminder schedule for condition ${conditionId}`);
      } else {
        console.log(`[useArmOperations] Successfully created reminder schedule for condition ${conditionId}`);
      }
      
      // Calculate deadline for immediate UI feedback
      let deadlineDate: Date | null = null;
      if (currentCondition.condition_type === "scheduled" && currentCondition.trigger_date) {
        deadlineDate = new Date(currentCondition.trigger_date);
      } else if (currentCondition.hours_threshold || currentCondition.minutes_threshold) {
        deadlineDate = new Date(now);
        if (currentCondition.hours_threshold) {
          deadlineDate.setHours(deadlineDate.getHours() + currentCondition.hours_threshold);
        }
        if (currentCondition.minutes_threshold) {
          deadlineDate.setMinutes(deadlineDate.getMinutes() + currentCondition.minutes_threshold);
        }
      }
      
      console.log(`[useArmOperations] Arm successful, deadline: ${deadlineDate?.toISOString() || 'unknown'}`);
      
      // Show success toast
      showArmSuccess();
      
      // Fire a confirmed update event now that we have real data
      emitConfirmedUpdate(
        conditionId, 
        messageId, 
        'arm',
        deadlineDate?.toISOString()
      );
      
      // NEW: Fire a specific event for message cards to handle
      window.dispatchEvent(new CustomEvent('message-reminder-updated', { 
        detail: { 
          messageId: messageId,
          conditionId,
          action: 'arm',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Fire a background event to handle reminder generation without blocking UI
      setTimeout(() => {
        requestReminderGeneration(messageId, conditionId);
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
