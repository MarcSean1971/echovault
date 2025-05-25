
import { supabase } from "@/integrations/supabase/client";
import { useActionToasts } from "./useActionToasts";
import { useConditionUpdates } from "./useConditionUpdates";
import { markRemindersObsolete } from "@/services/reminders/simpleReminderService";

/**
 * Hook for handling disarming message operations
 */
export function useDisarmOperations() {
  const { 
    showDisarmSuccess, 
    showDisarmError 
  } = useActionToasts();
  
  const {
    invalidateCache,
    emitOptimisticUpdate,
    emitConfirmedUpdate,
    refreshConditions
  } = useConditionUpdates();
  
  const disarmMessage = async (conditionId: string): Promise<void> => {
    if (!conditionId) {
      console.log("[useDisarmOperations] Cannot disarm message: no conditionId provided");
      return;
    }
    
    console.log(`[useDisarmOperations] Disarming message with condition ${conditionId}`);
    
    try {
      // First, get the current condition to extract messageId for later use
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("message_id")
        .eq("id", conditionId)
        .single();
        
      if (fetchError) {
        console.error("[useDisarmOperations] Error fetching condition:", fetchError);
        throw fetchError;
      }
      
      if (!currentCondition) {
        throw new Error("Condition not found");
      }
      
      const messageId = currentCondition.message_id;
      
      // Immediately invalidate cache to force a refresh on next query
      if (messageId) {
        invalidateCache(messageId);
      }
      
      // Emit an optimistic update event immediately
      emitOptimisticUpdate(conditionId, messageId, 'disarm');
      
      // CRITICAL FIX: Mark all reminders as obsolete when disarming
      console.log(`[useDisarmOperations] Marking reminders obsolete for message ${messageId}, condition ${conditionId}`);
      await markRemindersObsolete(messageId);
      
      // Direct database operation for faster disarming
      const { error } = await supabase
        .from("message_conditions")
        .update({ active: false })
        .eq("id", conditionId);
      
      if (error) {
        console.error("[useDisarmOperations] Error updating condition:", error);
        throw error;
      }
      
      console.log("[useDisarmOperations] Message disarmed successfully");
      
      // Show success toast
      showDisarmSuccess();
      
      // Fire a confirmed update event now that we have real data
      emitConfirmedUpdate(conditionId, messageId, 'disarm');
      
      // Refresh conditions data to update UI components with the latest state
      await refreshConditions();
    } catch (error) {
      console.error("[useDisarmOperations] Error disarming message:", error);
      showDisarmError();
    }
  };
  
  return { disarmMessage };
}
