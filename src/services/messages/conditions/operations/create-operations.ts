
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "../../reminderService";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { isCheckInCondition } from "../../../../../supabase/functions/send-reminder-emails/utils/condition-type";

/**
 * Creates a new condition in the database
 */
export async function createConditionInDb(conditionData: any) {
  try {
    // Add default values if needed
    const data = {
      ...conditionData,
      last_checked: new Date().toISOString(),
      active: true
    };
    
    // Insert the condition
    const { data: newCondition, error } = await supabase
      .from('message_conditions')
      .insert([data])
      .select()
      .single();
      
    if (error) {
      console.error("Error creating condition:", error);
      throw error;
    }
    
    // Create reminder schedule for the new condition
    if (newCondition) {
      try {
        const reminderMinutes = parseReminderMinutes(newCondition.reminder_hours);
        
        // Check condition type to determine the correct parameters
        if (isCheckInCondition(newCondition.condition_type)) {
          // For check-in conditions, use last_checked and threshold
          await createOrUpdateReminderSchedule({
            messageId: newCondition.message_id,
            conditionId: newCondition.id,
            conditionType: newCondition.condition_type,
            triggerDate: null,
            reminderMinutes,
            lastChecked: newCondition.last_checked,
            hoursThreshold: newCondition.hours_threshold,
            minutesThreshold: newCondition.minutes_threshold
          });
        } else {
          // For date-based conditions, use trigger_date
          // FIX: Add lastChecked parameter which was missing
          await createOrUpdateReminderSchedule({
            messageId: newCondition.message_id,
            conditionId: newCondition.id,
            conditionType: newCondition.condition_type,
            triggerDate: newCondition.trigger_date,
            reminderMinutes,
            lastChecked: newCondition.last_checked // Add the missing parameter
          });
        }
      } catch (scheduleError) {
        console.error("Error creating reminder schedule:", scheduleError);
        // Don't throw, just log - we don't want to fail the condition creation
      }
    }
    
    return newCondition;
  } catch (error) {
    console.error("Error in createConditionInDb:", error);
    throw error;
  }
}
