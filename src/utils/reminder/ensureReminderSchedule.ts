
import { supabase } from "@/integrations/supabase/client";
import { parseReminderMinutes } from "../reminderUtils";
import { getEffectiveDeadline } from "./reminderUtils";
import { generateReminderSchedule } from "./reminderGenerator";

/**
 * Ensures a reminder schedule exists for a message condition
 * This function should be called whenever conditions change that might affect reminders:
 * - When a message is armed
 * - When a message condition is updated/edited
 * - After check-ins that update the condition's last_checked time
 */
export async function ensureReminderSchedule(
  conditionId: string,
  messageId?: string
): Promise<boolean> {
  try {
    console.log(`[ENSURE-REMINDERS] Ensuring reminder schedule for condition ${conditionId}`);
    
    // Fetch condition if messageId isn't provided
    let condition;
    if (!messageId) {
      const { data, error } = await supabase
        .from('message_conditions')
        .select('*')
        .eq('id', conditionId)
        .single();
        
      if (error) {
        console.error("[ENSURE-REMINDERS] Error fetching condition:", error);
        return false;
      }
      
      condition = data;
      messageId = condition.message_id;
    } else {
      const { data, error } = await supabase
        .from('message_conditions')
        .select('*')
        .eq('id', conditionId)
        .eq('message_id', messageId)
        .single();
        
      if (error) {
        console.error("[ENSURE-REMINDERS] Error fetching condition:", error);
        return false;
      }
      
      condition = data;
    }
    
    if (!condition) {
      console.error("[ENSURE-REMINDERS] Condition not found");
      return false;
    }
    
    // Don't create reminders for inactive conditions
    if (!condition.active) {
      console.log("[ENSURE-REMINDERS] Condition is not active, skipping reminder creation");
      return true;
    }
    
    // Get reminder times (already in minutes in the database)
    const reminderMinutes = parseReminderMinutes(condition.reminder_hours);
    
    // Calculate effective deadline based on condition type
    const effectiveDeadline = getEffectiveDeadline(condition);
    
    if (!effectiveDeadline) {
      console.warn("[ENSURE-REMINDERS] Could not determine deadline for condition");
      return false;
    }
    
    console.log(`[ENSURE-REMINDERS] Determined deadline: ${effectiveDeadline.toISOString()}`);
    console.log(`[ENSURE-REMINDERS] Using reminder minutes: ${JSON.stringify(reminderMinutes)}`);
    
    // Generate reminder schedule
    return await generateReminderSchedule(
      messageId,
      conditionId,
      effectiveDeadline,
      reminderMinutes
    );
  } catch (error) {
    console.error("[ENSURE-REMINDERS] Error ensuring reminder schedule:", error);
    return false;
  }
}
