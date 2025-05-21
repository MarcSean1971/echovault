
import { supabase } from "@/integrations/supabase/client";
import { parseReminderMinutes } from "../reminderUtils";
import { getEffectiveDeadline } from "./reminderUtils";
import { markRemindersAsObsolete } from "./reminderUtils";
import { generateReminderSchedule } from "./reminderGenerator";

/**
 * Ensures a reminder schedule exists for a message condition
 * This function should be called whenever conditions change that might affect reminders:
 * - When a message is armed
 * - When a message condition is updated/edited
 * - After check-ins that update the condition's last_checked time
 * 
 * FIXED: Enhanced error handling, logging, and proper handling of reminder minutes values
 * FIXED: Added isEdit parameter to avoid sending notifications during edits
 * MODIFIED: Allow empty reminder arrays - don't set defaults
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
    
    // FIXED: Enhanced logging of database values
    console.log("[ENSURE-REMINDERS] Raw reminder_hours from database:", condition.reminder_hours);
    console.log("[ENSURE-REMINDERS] Type of reminder_hours:", typeof condition.reminder_hours);
    console.log("[ENSURE-REMINDERS] Is Array:", Array.isArray(condition.reminder_hours));
    
    // First mark existing reminders as obsolete
    try {
      console.log(`[ENSURE-REMINDERS] Marking existing reminders as obsolete for message ${messageId}`);
      await markRemindersAsObsolete(messageId, conditionId);
    } catch (obsoleteError) {
      console.error("[ENSURE-REMINDERS] Error marking reminders as obsolete:", obsoleteError);
      // Continue execution to attempt creating new reminders even if marking obsolete fails
    }
    
    // FIXED: Improved reminder minutes handling - allow empty arrays
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
      // MODIFIED: Use empty array instead of default
      console.log("[ENSURE-REMINDERS] No reminder values found, using empty array");
      reminderMinutes = [];
    }
    
    // Validate all entries are numbers and remove any NaN values
    reminderMinutes = reminderMinutes
      .map(Number)
      .filter(min => !isNaN(min) && min > 0);
      
    // MODIFIED: Allow empty arrays - don't set defaults
    console.log("[ENSURE-REMINDERS] Final reminder minutes to use:", reminderMinutes);
    
    // Calculate effective deadline based on condition type
    const effectiveDeadline = getEffectiveDeadline(condition);
    
    if (!effectiveDeadline) {
      console.warn("[ENSURE-REMINDERS] Could not determine deadline for condition");
      return false;
    }
    
    console.log(`[ENSURE-REMINDERS] Determined deadline: ${effectiveDeadline.toISOString()}`);
    
    // Generate reminder schedule
    try {
      const result = await generateReminderSchedule(
        messageId,
        conditionId,
        effectiveDeadline,
        reminderMinutes,
        isEdit // Pass the isEdit flag to distinguish between edit and new/arm operations
      );
      
      if (result) {
        console.log("[ENSURE-REMINDERS] Successfully generated reminder schedule");
        return true;
      } else {
        console.error("[ENSURE-REMINDERS] Failed to generate reminder schedule");
        return false;
      }
    } catch (scheduleError) {
      console.error("[ENSURE-REMINDERS] Error generating reminder schedule:", scheduleError);
      
      // Enhanced error logging with more details
      if (scheduleError.message?.includes("policy")) {
        console.error("[ENSURE-REMINDERS] This appears to be a permissions error with RLS policies");
        
        // Try the edge function approach as a fallback
        try {
          console.log("[ENSURE-REMINDERS] Attempting to use edge function to regenerate reminders");
          await supabase.functions.invoke("send-reminder-emails", {
            body: { 
              messageId, 
              debug: true, 
              forceSend: false, // Never force send from backup method
              action: "regenerate-schedule" 
            }
          });
          console.log("[ENSURE-REMINDERS] Successfully triggered edge function to regenerate reminders");
          return true;
        } catch (edgeFunctionError) {
          console.error("[ENSURE-REMINDERS] Edge function fallback failed:", edgeFunctionError);
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error("[ENSURE-REMINDERS] Error ensuring reminder schedule:", error);
    return false;
  }
}
