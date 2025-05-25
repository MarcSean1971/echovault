
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { armMessage, disarmMessage, getMessageDeadline as fetchDeadline } from "./conditionService";
import { createReminderSchedule } from "@/services/reminders/simpleReminderService";
import { parseReminderMinutes } from "@/utils/reminderUtils";

/**
 * Deletes a message with the given ID
 */
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
      
    if (error) throw error;
    
    toast({
      title: "Message deleted",
      description: "Your message has been permanently deleted",
    });
    
    return true;
  } catch (error: any) {
    console.error("Error deleting message:", error);
    toast({
      title: "Error",
      description: "Failed to delete the message",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Simple deadline calculation
 */
function getEffectiveDeadline(condition: any): Date | null {
  if (condition.trigger_date) {
    return new Date(condition.trigger_date);
  }
  
  if (condition.last_checked && (condition.hours_threshold || condition.minutes_threshold)) {
    const deadline = new Date(condition.last_checked);
    
    if (condition.hours_threshold) {
      deadline.setHours(deadline.getHours() + condition.hours_threshold);
    }
    
    if (condition.minutes_threshold) {
      deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
    }
    
    return deadline;
  }
  
  return null;
}

/**
 * Arms a message with the given condition ID
 */
export const handleArmMessage = async (conditionId: string, setIsArmed: (isArmed: boolean) => void): Promise<Date | null> => {
  try {
    // First arm the message and set armed status
    await armMessage(conditionId);
    setIsArmed(true);
    
    // Get updated deadline
    const deadlineDate = await fetchDeadline(conditionId);
    
    // Get full condition details to access reminder settings
    const { data: condition, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('id', conditionId)
      .single();
      
    if (conditionError) {
      console.error("Error fetching complete condition details:", conditionError);
    } else if (condition) {
      console.log("[ARM-MESSAGE] Retrieved condition details, generating reminder schedule");
      const messageId = condition.message_id;
      
      // Get parsed reminder minutes (they are already stored as minutes in DB)
      const reminderMinutes = parseReminderMinutes(condition.reminder_hours);
      
      // Calculate effective deadline based on condition type
      const effectiveDeadline = deadlineDate || getEffectiveDeadline(condition);
      
      if (effectiveDeadline && reminderMinutes && reminderMinutes.length > 0) {
        console.log(`[ARM-MESSAGE] Generating reminder schedule for ${reminderMinutes.length} reminders`);
        console.log(`[ARM-MESSAGE] Deadline: ${effectiveDeadline.toISOString()}`);
        console.log(`[ARM-MESSAGE] Reminder minutes: ${JSON.stringify(reminderMinutes)}`);
        
        // Generate and store reminder schedule
        try {
          const result = await createReminderSchedule({
            messageId: messageId,
            conditionId: conditionId,
            conditionType: condition.condition_type,
            triggerDate: condition.trigger_date,
            lastChecked: condition.last_checked,
            hoursThreshold: condition.hours_threshold,
            minutesThreshold: condition.minutes_threshold,
            reminderHours: condition.reminder_hours
          });
          
          if (result) {
            console.log("[ARM-MESSAGE] Successfully generated reminder schedule");
            
            // Dispatch an event to refresh UI components
            window.dispatchEvent(new CustomEvent('conditions-updated', { 
              detail: { messageId, conditionId, updatedAt: new Date().toISOString() }
            }));
          } else {
            console.error("[ARM-MESSAGE] Failed to generate reminder schedule");
          }
        } catch (scheduleError) {
          console.error("[ARM-MESSAGE] Error generating reminder schedule:", scheduleError);
        }
      } else {
        console.warn("[ARM-MESSAGE] Missing deadline or reminder minutes, no schedule generated");
        console.log(`- Deadline: ${effectiveDeadline ? effectiveDeadline.toISOString() : 'null'}`);
        console.log(`- Reminder minutes: ${reminderMinutes ? JSON.stringify(reminderMinutes) : 'null'}`);
      }
    }
    
    toast({
      title: "Message armed",
      description: "Your message has been armed and will trigger according to your settings",
    });
    
    return deadlineDate;
  } catch (error) {
    console.error("Error arming message:", error);
    toast({
      title: "Failed to arm message",
      description: "There was a problem arming your message",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Disarms a message with the given condition ID
 */
export const handleDisarmMessage = async (conditionId: string, setIsArmed: (isArmed: boolean) => void): Promise<void> => {
  try {
    await disarmMessage(conditionId);
    setIsArmed(false);
    
    toast({
      title: "Message disarmed",
      description: "Your message has been disarmed and will not trigger",
    });
  } catch (error) {
    console.error("Error disarming message:", error);
    toast({
      title: "Failed to disarm message",
      description: "There was a problem disarming your message",
      variant: "destructive"
    });
  }
};

// Using the imported function instead
export { fetchDeadline as getMessageDeadline };
