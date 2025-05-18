
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "../../reminder"; // Changed from ../../reminderService to ../../reminder
import { parseReminderMinutes } from "@/utils/reminderUtils";

/**
 * Updates a condition in the database
 */
export async function updateConditionInDb(conditionId: string, updateData: any) {
  try {
    const { data, error } = await supabase
      .from('message_conditions')
      .update(updateData)
      .eq('id', conditionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating condition:", error);
      throw error;
    }
    
    // When condition is updated, update the reminder schedule
    if (data) {
      try {
        const reminderMinutes = parseReminderMinutes(data.reminder_hours);
        
        await createOrUpdateReminderSchedule({
          messageId: data.message_id,
          conditionId: data.id,
          conditionType: data.condition_type,
          triggerDate: data.trigger_date,
          reminderMinutes,
          lastChecked: data.last_checked,
          hoursThreshold: data.hours_threshold,
          minutesThreshold: data.minutes_threshold
        });
      } catch (scheduleError) {
        console.error("Error updating reminder schedule:", scheduleError);
        // Don't throw, just log - we don't want to fail the condition update
      }
    }

    return data;
  } catch (error) {
    console.error("Error in updateConditionInDb:", error);
    throw error;
  }
}

/**
 * Updates the last checked timestamp for conditions
 */
export async function updateConditionsLastChecked(conditionIds: string[]) {
  try {
    const now = new Date().toISOString();
    
    // Update last_checked for specific conditions
    const { data, error } = await supabase
      .from('message_conditions')
      .update({ last_checked: now })
      .in('id', conditionIds)
      .select();

    if (error) {
      console.error("Error updating last_checked:", error);
      throw error;
    }
    
    // For each updated condition, update the reminder schedule
    if (data && data.length > 0) {
      for (const condition of data) {
        try {
          const reminderMinutes = parseReminderMinutes(condition.reminder_hours);
          
          await createOrUpdateReminderSchedule({
            messageId: condition.message_id,
            conditionId: condition.id,
            conditionType: condition.condition_type,
            triggerDate: condition.trigger_date,
            reminderMinutes,
            lastChecked: now, // Use the just-updated timestamp
            hoursThreshold: condition.hours_threshold,
            minutesThreshold: condition.minutes_threshold
          });
        } catch (scheduleError) {
          console.error(`Error updating reminder schedule for condition ${condition.id}:`, scheduleError);
        }
      }
    }

    return data;
  } catch (error) {
    console.error("Error in updateConditionsLastChecked:", error);
    throw error;
  }
}
