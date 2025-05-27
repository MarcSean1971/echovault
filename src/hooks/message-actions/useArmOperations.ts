
import { supabase } from "@/integrations/supabase/client";
import { useActionToasts } from "./useActionToasts";
import { useConditionUpdates } from "./useConditionUpdates";
import { createOrUpdateReminderSchedule } from "@/services/messages/reminder/scheduleService";

/**
 * SIMPLIFIED: Hook for handling arming message operations
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
    refreshConditions
  } = useConditionUpdates();
  
  const armMessage = async (conditionId: string): Promise<Date | null> => {
    if (!conditionId) {
      console.log("[useArmOperations] Cannot arm message: no conditionId provided");
      return null;
    }
    
    console.log(`[useArmOperations] SIMPLE arming message with condition ${conditionId}`);
    
    try {
      // Get the current condition
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("message_id, condition_type, hours_threshold, minutes_threshold, last_checked, reminder_hours, trigger_date")
        .eq("id", conditionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const messageId = currentCondition?.message_id;
      
      // Invalidate cache immediately
      if (messageId) {
        invalidateCache(messageId);
      }
      
      // Emit optimistic update
      emitOptimisticUpdate(conditionId, messageId, 'arm');
      
      // Arm the condition
      const { data, error } = await supabase
        .from("message_conditions")
        .update({ 
          active: true,
          last_checked: new Date().toISOString() 
        })
        .eq("id", conditionId)
        .select("id, message_id, condition_type, hours_threshold, minutes_threshold, last_checked, reminder_hours, trigger_date")
        .single();
      
      if (error) {
        throw error;
      }
      
      const actualMessageId = data.message_id;
      
      // Calculate deadline for UI feedback
      let deadlineDate: Date | null = null;
      if (data.condition_type === "scheduled" && data.trigger_date) {
        deadlineDate = new Date(data.trigger_date);
      } else if (data.hours_threshold) {
        const hoursInMs = data.hours_threshold * 60 * 60 * 1000;
        const minutesInMs = (data.minutes_threshold || 0) * 60 * 1000;
        deadlineDate = new Date(Date.now() + hoursInMs + minutesInMs);
      }
      
      console.log(`[useArmOperations] Deadline calculated: ${deadlineDate?.toISOString() || 'unknown'}`);
      
      // SIMPLIFIED: Create reminder schedule entries
      if (deadlineDate) {
        console.log(`[useArmOperations] Creating reminder schedule for armed message`);
        
        // Parse reminder minutes from reminder_hours
        const reminderMinutes = (data.reminder_hours || [24]).map((hours: number) => hours * 60);
        
        await createOrUpdateReminderSchedule({
          messageId: actualMessageId,
          conditionId: conditionId,
          conditionType: data.condition_type,
          reminderMinutes: reminderMinutes,
          lastChecked: data.last_checked,
          hoursThreshold: data.hours_threshold,
          minutesThreshold: data.minutes_threshold,
          triggerDate: data.trigger_date
        }, false);
        
        console.log(`[useArmOperations] Reminder schedule created for message ${actualMessageId}`);
      }
      
      // Show success
      showArmSuccess();
      
      // Emit confirmed update
      emitConfirmedUpdate(
        conditionId, 
        actualMessageId, 
        'arm',
        deadlineDate?.toISOString()
      );
      
      // Fire update event
      window.dispatchEvent(new CustomEvent('message-condition-updated', { 
        detail: { 
          messageId: actualMessageId,
          conditionId,
          action: 'arm',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Refresh conditions
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
