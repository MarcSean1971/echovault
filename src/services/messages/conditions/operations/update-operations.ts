
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "../../reminder"; 
import { parseReminderMinutes } from "@/utils/reminderUtils";

/**
 * Updates a condition in the database
 * FIXED: Proper handling of reminder_hours array values
 */
export async function updateConditionInDb(conditionId: string, updateData: any) {
  try {
    console.log("[updateConditionInDb] Starting update with data:", JSON.stringify(updateData, null, 2));
    
    // Ensure reminder_hours is properly formatted for database storage
    if (updateData.reminder_hours) {
      // Ensure we have an array of numbers
      if (Array.isArray(updateData.reminder_hours)) {
        // Convert all elements to numbers to ensure consistent data type
        updateData.reminder_hours = updateData.reminder_hours.map(Number);
        console.log("[updateConditionInDb] Normalized reminder_hours:", updateData.reminder_hours);
      } else {
        console.warn("[updateConditionInDb] reminder_hours is not an array, using default");
        updateData.reminder_hours = [1440]; // Default to 24 hours if not an array
      }
    }
    
    // Perform the update
    const { data, error } = await supabase
      .from('message_conditions')
      .update(updateData)
      .eq('id', conditionId)
      .select()
      .single();

    if (error) {
      console.error("[updateConditionInDb] Error updating condition:", error);
      throw error;
    }
    
    console.log("[updateConditionInDb] Update successful, returned data:", data);
    
    // When condition is updated, update the reminder schedule
    if (data) {
      try {
        // Get the updated reminder minutes, making sure we use the most up-to-date values
        const reminderMinutes = Array.isArray(data.reminder_hours) 
          ? data.reminder_hours.map(Number)
          : parseReminderMinutes(data.reminder_hours);
        
        console.log("[updateConditionInDb] Using reminder minutes for schedule:", reminderMinutes);
        
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
        console.error("[updateConditionInDb] Error updating reminder schedule:", scheduleError);
        // Don't throw, just log - we don't want to fail the condition update
      }
    }

    return data;
  } catch (error) {
    console.error("[updateConditionInDb] Error:", error);
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
      console.error("[updateConditionsLastChecked] Error updating last_checked:", error);
      throw error;
    }
    
    // For each updated condition, update the reminder schedule
    if (data && data.length > 0) {
      for (const condition of data) {
        try {
          // Use Array.isArray check directly
          const reminderMinutes = Array.isArray(condition.reminder_hours) 
            ? condition.reminder_hours.map(Number)
            : parseReminderMinutes(condition.reminder_hours);
          
          console.log("[updateConditionsLastChecked] Using reminder minutes:", reminderMinutes);
          
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
          console.error(`[updateConditionsLastChecked] Error updating reminder schedule for condition ${condition.id}:`, scheduleError);
        }
      }
    }

    return data;
  } catch (error) {
    console.error("[updateConditionsLastChecked] Error:", error);
    throw error;
  }
}
