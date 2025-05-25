
import { supabase } from "@/integrations/supabase/client";
import { parseReminderMinutes } from "../reminderUtils";
import { createReminderSchedule, markRemindersObsolete } from "@/services/reminders/simpleReminderService";

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
 * Ensures a reminder schedule exists for a message condition
 * SIMPLIFIED: Uses the simple reminder service
 */
export async function ensureReminderSchedule(
  conditionIdOrMessageId: string,
  isEdit: boolean = false
): Promise<boolean> {
  try {
    console.log(`[ENSURE-REMINDERS] Ensuring reminder schedule for ${conditionIdOrMessageId}, isEdit=${isEdit}`);
    
    let condition;
    let messageId: string;
    let conditionId: string;
    
    // Check if the input looks like a UUID (likely a condition ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conditionIdOrMessageId);
    
    if (isUUID) {
      // Try to fetch as condition ID first
      const { data: conditionData, error: conditionError } = await supabase
        .from('message_conditions')
        .select('*')
        .eq('id', conditionIdOrMessageId)
        .single();
        
      if (conditionError || !conditionData) {
        // If not found as condition ID, try as message ID
        const { data: messageConditionData, error: messageError } = await supabase
          .from('message_conditions')
          .select('*')
          .eq('message_id', conditionIdOrMessageId)
          .single();
          
        if (messageError || !messageConditionData) {
          console.error("[ENSURE-REMINDERS] Could not find condition or message:", messageError || conditionError);
          return false;
        }
        
        condition = messageConditionData;
        messageId = conditionIdOrMessageId;
        conditionId = condition.id;
      } else {
        condition = conditionData;
        conditionId = condition.id;
        messageId = condition.message_id;
      }
    } else {
      console.error("[ENSURE-REMINDERS] Invalid ID format:", conditionIdOrMessageId);
      return false;
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
    
    // Log the condition type for debugging
    console.log(`[ENSURE-REMINDERS] Processing condition type: ${condition.condition_type}`);
    
    // First mark existing reminders as obsolete
    try {
      console.log(`[ENSURE-REMINDERS] Marking existing reminders as obsolete for message ${messageId}`);
      await markRemindersObsolete(messageId);
    } catch (obsoleteError) {
      console.error("[ENSURE-REMINDERS] Error marking reminders as obsolete:", obsoleteError);
      // Continue execution to attempt creating new reminders even if marking obsolete fails
    }
    
    // Parse reminder minutes
    let reminderMinutes: number[] = [];
    
    // Direct array handling - most efficient
    if (condition.reminder_hours && Array.isArray(condition.reminder_hours)) {
      reminderMinutes = condition.reminder_hours.map(Number);
      console.log("[ENSURE-REMINDERS] Using direct array values:", reminderMinutes);
    } 
    // String or JSON string handling
    else if (condition.reminder_hours) {
      // Try to parse as JSON if it's a string representation of an array
      if (typeof condition.reminder_hours === 'string') {
        try {
          const parsed = JSON.parse(condition.reminder_hours);
          if (Array.isArray(parsed)) {
            reminderMinutes = parsed.map(Number);
            console.log("[ENSURE-REMINDERS] Parsed from JSON string:", reminderMinutes);
          } else {
            reminderMinutes = [Number(condition.reminder_hours)];
            console.log("[ENSURE-REMINDERS] Converted single string value:", reminderMinutes);
          }
        } catch (e) {
          // If parsing fails, use fallback parser
          reminderMinutes = parseReminderMinutes(condition.reminder_hours);
          console.log("[ENSURE-REMINDERS] Used fallback parser:", reminderMinutes);
        }
      } 
      // Handle non-string, non-array values (should be rare)
      else {
        console.log("[ENSURE-REMINDERS] Using non-standard reminder value type:", condition.reminder_hours);
        reminderMinutes = [];
      }
    } else {
      console.log("[ENSURE-REMINDERS] No reminder values found, using empty array");
      reminderMinutes = [];
    }
    
    // Validate all entries are numbers and remove any NaN values
    reminderMinutes = reminderMinutes
      .map(Number)
      .filter(min => !isNaN(min) && min > 0);
      
    console.log("[ENSURE-REMINDERS] Final reminder minutes to use:", reminderMinutes);
    
    // Use the simplified reminder service
    const success = await createReminderSchedule({
      messageId: messageId,
      conditionId: conditionId,
      conditionType: condition.condition_type,
      triggerDate: condition.trigger_date,
      lastChecked: condition.last_checked,
      hoursThreshold: condition.hours_threshold,
      minutesThreshold: condition.minutes_threshold,
      reminderHours: reminderMinutes.map(m => m / 60) // Convert back to hours for the service
    });
    
    if (success) {
      console.log("[ENSURE-REMINDERS] Successfully created reminder schedule");
      return true;
    } else {
      console.error("[ENSURE-REMINDERS] Failed to create reminder schedule");
      return false;
    }
  } catch (error) {
    console.error("[ENSURE-REMINDERS] Error ensuring reminder schedule:", error);
    return false;
  }
}
