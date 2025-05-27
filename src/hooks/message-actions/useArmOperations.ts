
import { supabase } from "@/integrations/supabase/client";
import { useActionToasts } from "./useActionToasts";
import { useConditionUpdates } from "./useConditionUpdates";
import { createOrUpdateReminderSchedule } from "@/services/messages/reminder/scheduleService";

/**
 * FIXED: Hook for handling arming message operations with proper reminder schedule creation
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
    
    console.log(`[useArmOperations] FIXED arming message with condition ${conditionId}`);
    
    try {
      // Get the current condition with all required data
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
      
      console.log(`[useArmOperations] Found condition:`, currentCondition);
      
      // Invalidate cache immediately
      invalidateCache(messageId);
      
      // Emit optimistic update
      emitOptimisticUpdate(conditionId, messageId, 'arm');
      
      // Arm the condition with last_checked update
      const { data: updatedCondition, error: armError } = await supabase
        .from("message_conditions")
        .update({ 
          active: true,
          last_checked: new Date().toISOString() 
        })
        .eq("id", conditionId)
        .select("*")
        .single();
      
      if (armError) {
        console.error("[useArmOperations] Error arming condition:", armError);
        throw armError;
      }
      
      console.log(`[useArmOperations] Successfully armed condition:`, updatedCondition);
      
      // Calculate deadline for UI feedback
      let deadlineDate: Date | null = null;
      
      if (updatedCondition.condition_type === "scheduled" && updatedCondition.trigger_date) {
        deadlineDate = new Date(updatedCondition.trigger_date);
      } else if (updatedCondition.condition_type === "panic_trigger") {
        // For panic triggers, set a future deadline for display purposes
        deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      } else if (updatedCondition.hours_threshold) {
        const hoursInMs = updatedCondition.hours_threshold * 60 * 60 * 1000;
        const minutesInMs = (updatedCondition.minutes_threshold || 0) * 60 * 1000;
        deadlineDate = new Date(Date.now() + hoursInMs + minutesInMs);
      }
      
      console.log(`[useArmOperations] Calculated deadline: ${deadlineDate?.toISOString() || 'none'}`);
      
      // CRITICAL FIX: Always create reminder schedule for armed messages
      try {
        console.log(`[useArmOperations] Creating reminder schedule for armed message`);
        
        // Parse reminder minutes from reminder_hours
        let reminderMinutes: number[] = [];
        
        if (updatedCondition.reminder_hours && Array.isArray(updatedCondition.reminder_hours)) {
          reminderMinutes = updatedCondition.reminder_hours.map(h => h * 60);
        } else if (updatedCondition.reminder_hours) {
          // Handle non-array values
          const hours = Array.isArray(updatedCondition.reminder_hours) 
            ? updatedCondition.reminder_hours 
            : [updatedCondition.reminder_hours];
          reminderMinutes = hours.map(h => Number(h) * 60).filter(m => !isNaN(m));
        }
        
        // Default to 24 hours (1440 minutes) for panic triggers if no reminders specified
        if (reminderMinutes.length === 0 && updatedCondition.condition_type === "panic_trigger") {
          reminderMinutes = [1440]; // 24 hours in minutes
        }
        
        console.log(`[useArmOperations] Using reminder minutes:`, reminderMinutes);
        
        const reminderResult = await createOrUpdateReminderSchedule({
          messageId: messageId,
          conditionId: conditionId,
          conditionType: updatedCondition.condition_type,
          reminderMinutes: reminderMinutes,
          lastChecked: updatedCondition.last_checked,
          hoursThreshold: updatedCondition.hours_threshold,
          minutesThreshold: updatedCondition.minutes_threshold,
          triggerDate: updatedCondition.trigger_date
        }, false);
        
        if (!reminderResult) {
          console.error(`[useArmOperations] CRITICAL: Failed to create reminder schedule for message ${messageId}`);
          
          // Show error but don't fail the entire operation
          showArmError("Message armed but reminder schedule creation failed. Reminders may not work properly.");
          
          // Still emit confirmed update so UI shows armed state
          emitConfirmedUpdate(
            conditionId, 
            messageId, 
            'arm',
            deadlineDate?.toISOString()
          );
          
          return deadlineDate;
        }
        
        console.log(`[useArmOperations] Successfully created reminder schedule for message ${messageId}`);
        
      } catch (reminderError) {
        console.error(`[useArmOperations] Error creating reminder schedule:`, reminderError);
        
        // Show specific error for reminder creation failure
        showArmError("Message armed but reminder setup failed. Please try disarming and arming again.");
        
        // Still continue with success flow since the message is armed
      }
      
      // Show success
      showArmSuccess();
      
      // Emit confirmed update
      emitConfirmedUpdate(
        conditionId, 
        messageId, 
        'arm',
        deadlineDate?.toISOString()
      );
      
      // Fire update event
      window.dispatchEvent(new CustomEvent('message-condition-updated', { 
        detail: { 
          messageId: messageId,
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
      showArmError(`Failed to arm message: ${error.message}`);
      return null;
    }
  };
  
  return { armMessage };
}
