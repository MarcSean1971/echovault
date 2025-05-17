
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "../../reminderService";
import { parseReminderMinutes } from "@/utils/reminderUtils";

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
        
        await createOrUpdateReminderSchedule(
          newCondition.message_id,
          newCondition.id,
          newCondition.condition_type,
          newCondition.trigger_date,
          reminderMinutes,
          newCondition.last_checked,
          newCondition.hours_threshold,
          newCondition.minutes_threshold
        );
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
