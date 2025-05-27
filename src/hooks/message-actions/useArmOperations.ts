
import { supabase } from "@/integrations/supabase/client";
import { useActionToasts } from "./useActionToasts";
import { useConditionUpdates } from "./useConditionUpdates";

/**
 * Hook for handling arming message operations - SIMPLIFIED for final delivery
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
    
    console.log(`[useArmOperations] Arming message with condition ${conditionId}`);
    
    try {
      // Get the current condition
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("message_id, condition_type, hours_threshold, minutes_threshold, last_checked")
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
        .select("id, message_id, condition_type, hours_threshold, minutes_threshold, last_checked")
        .single();
      
      if (error) {
        throw error;
      }
      
      const actualMessageId = data.message_id;
      
      // Calculate deadline for UI feedback
      let deadlineDate: Date | null = null;
      if (data.condition_type === "scheduled") {
        // For scheduled conditions, get trigger_date
        const { data: fullCondition } = await supabase
          .from("message_conditions")
          .select("trigger_date")
          .eq("id", conditionId)
          .single();
        
        if (fullCondition?.trigger_date) {
          deadlineDate = new Date(fullCondition.trigger_date);
        }
      } else if (data.hours_threshold) {
        const hoursInMs = data.hours_threshold * 60 * 60 * 1000;
        const minutesInMs = (data.minutes_threshold || 0) * 60 * 1000;
        deadlineDate = new Date(Date.now() + hoursInMs + minutesInMs);
      }
      
      console.log(`[useArmOperations] Deadline calculated: ${deadlineDate?.toISOString() || 'unknown'}`);
      
      // Check if deadline has already passed and trigger immediate final delivery
      if (deadlineDate && deadlineDate <= new Date()) {
        console.log(`[useArmOperations] Deadline has passed - triggering immediate final delivery`);
        
        try {
          const { error: triggerError } = await supabase.functions.invoke('send-message-notifications', {
            body: {
              messageId: actualMessageId,
              forceSend: true,
              debug: true,
              source: 'immediate_arm_delivery'
            }
          });
          
          if (triggerError) {
            console.error(`[useArmOperations] Error triggering immediate delivery:`, triggerError);
          } else {
            console.log(`[useArmOperations] Successfully triggered immediate delivery`);
          }
        } catch (deliveryError) {
          console.error(`[useArmOperations] Exception triggering immediate delivery:`, deliveryError);
        }
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
