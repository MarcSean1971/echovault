
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "../../reminder"; // Changed from ../../reminderService to ../../reminder
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
      active: false // CRITICAL FIX: Set default value to false to prevent reminder creation until armed
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
    
    // Don't create reminder schedule by default - this will be done during arming
    console.log("[create-operations] Created condition but NOT creating reminder schedule (will be done on arm)");
    
    return newCondition;
  } catch (error) {
    console.error("Error in createConditionInDb:", error);
    throw error;
  }
}
