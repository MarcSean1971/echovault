
import { supabase } from "@/integrations/supabase/client";
import { createReminderSchedule, markRemindersObsolete } from "@/services/reminders/simpleReminderService";

/**
 * SIMPLIFIED: Arm a message condition - create reminders immediately
 */
export async function armMessage(conditionId: string): Promise<{ success: boolean; deadline?: Date; error?: string }> {
  try {
    console.log("[ARM-MESSAGE] Arming condition:", conditionId);
    
    // Get the condition details
    const { data: condition, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('id', conditionId)
      .single();
    
    if (conditionError || !condition) {
      console.error("[ARM-MESSAGE] Error fetching condition:", conditionError);
      return { success: false, error: "Condition not found" };
    }
    
    // Activate the condition
    const { error: updateError } = await supabase
      .from('message_conditions')
      .update({ 
        active: true,
        last_checked: new Date().toISOString()
      })
      .eq('id', conditionId);
    
    if (updateError) {
      console.error("[ARM-MESSAGE] Error activating condition:", updateError);
      return { success: false, error: "Failed to activate condition" };
    }
    
    // SIMPLIFIED: Create reminder schedule immediately
    const reminderSuccess = await createReminderSchedule({
      messageId: condition.message_id,
      conditionId: conditionId,
      conditionType: condition.condition_type,
      triggerDate: condition.trigger_date,
      lastChecked: new Date().toISOString(),
      hoursThreshold: condition.hours_threshold,
      minutesThreshold: condition.minutes_threshold,
      reminderHours: condition.reminder_hours || [24, 12, 6, 1]
    });
    
    if (!reminderSuccess) {
      console.warn("[ARM-MESSAGE] Reminder schedule creation failed, but condition is armed");
    }
    
    // Calculate deadline for return
    let deadline: Date | null = null;
    
    if (condition.trigger_date) {
      deadline = new Date(condition.trigger_date);
    } else if (condition.hours_threshold || condition.minutes_threshold) {
      deadline = new Date();
      if (condition.hours_threshold) {
        deadline.setHours(deadline.getHours() + condition.hours_threshold);
      }
      if (condition.minutes_threshold) {
        deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
      }
    }
    
    console.log("[ARM-MESSAGE] Successfully armed condition with deadline:", deadline?.toISOString());
    
    return { 
      success: true, 
      deadline: deadline || undefined 
    };
    
  } catch (error: any) {
    console.error("[ARM-MESSAGE] Error in armMessage:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error occurred" 
    };
  }
}

/**
 * SIMPLIFIED: Disarm a message condition - mark reminders obsolete
 */
export async function disarmMessage(conditionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[DISARM-MESSAGE] Disarming condition:", conditionId);
    
    // Get the condition to find message ID
    const { data: condition, error: conditionError } = await supabase
      .from('message_conditions')
      .select('message_id')
      .eq('id', conditionId)
      .single();
    
    if (conditionError || !condition) {
      console.error("[DISARM-MESSAGE] Error fetching condition:", conditionError);
      return { success: false, error: "Condition not found" };
    }
    
    // Deactivate the condition
    const { error: updateError } = await supabase
      .from('message_conditions')
      .update({ active: false })
      .eq('id', conditionId);
    
    if (updateError) {
      console.error("[DISARM-MESSAGE] Error deactivating condition:", updateError);
      return { success: false, error: "Failed to deactivate condition" };
    }
    
    // SIMPLIFIED: Mark reminders as obsolete
    await markRemindersObsolete(condition.message_id);
    
    console.log("[DISARM-MESSAGE] Successfully disarmed condition");
    
    return { success: true };
    
  } catch (error: any) {
    console.error("[DISARM-MESSAGE] Error in disarmMessage:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error occurred" 
    };
  }
}

/**
 * SIMPLIFIED: Get message deadline
 */
export async function getMessageDeadline(messageId: string): Promise<Date | null> {
  try {
    const { data: condition, error } = await supabase
      .from('message_conditions')
      .select('trigger_date, last_checked, hours_threshold, minutes_threshold, active')
      .eq('message_id', messageId)
      .eq('active', true)
      .single();
    
    if (error || !condition) {
      return null;
    }
    
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
    
  } catch (error) {
    console.error("[GET-DEADLINE] Error:", error);
    return null;
  }
}
