
import { supabase } from "@/integrations/supabase/client";
import { parseReminderMinutes } from "../reminderUtils";
import { getEffectiveDeadline } from "./reminderUtils";
import { markRemindersAsObsolete } from "./reminderUtils";
import { generateReminderSchedule, generateCheckInReminderSchedule } from "./reminderGenerator";

/**
 * Ensures a reminder schedule exists for a message condition
 * This function should be called whenever conditions change that might affect reminders:
 * - When a message is armed
 * - When a message condition is updated/edited
 * - After check-ins that update the condition's last_checked time
 * 
 * FIXED: Enhanced error handling, logging, and proper handling of reminder minutes values
 * FIXED: Added isEdit parameter to avoid sending notifications during edits
 * FIXED: Now properly handles check-in conditions vs standard conditions
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
    
    // FIXED: Enhanced logging of database values
    console.log("[ENSURE-REMINDERS] Raw reminder_hours from database:", condition.reminder_hours);
    console.log("[ENSURE-REMINDERS] Type of reminder_hours:", typeof condition.reminder_hours);
    console.log("[ENSURE-REMINDERS] Is Array:", Array.isArray(condition.reminder_hours));
    
    // First mark existing reminders as obsolete
    try {
      console.log(`[ENSURE-REMINDERS] Marking existing reminders as obsolete for message ${messageId}`);
      await markRemindersAsObsolete(messageId, conditionId, isEdit);
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
    
    // CRITICAL FIX: Different handling for check-in vs. standard conditions
    const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
    
    if (isCheckInCondition) {
      // For check-in conditions, use the specialized generator
      console.log("[ENSURE-REMINDERS] Using check-in reminder generator for condition type:", condition.condition_type);
      
      if (!condition.last_checked) {
        console.error("[ENSURE-REMINDERS] Cannot create check-in reminders - no last_checked timestamp");
        return false;
      }
      
      const lastCheckedDate = new Date(condition.last_checked);
      const hoursThreshold = condition.hours_threshold || 0;
      const minutesThreshold = condition.minutes_threshold || 0;
      
      try {
        const result = await generateCheckInReminderSchedule(
          messageId,
          conditionId,
          lastCheckedDate,
          hoursThreshold,
          minutesThreshold,
          reminderMinutes,
          isEdit // Pass isEdit flag to prevent notifications during edits/arming
        );
        
        if (result) {
          console.log("[ENSURE-REMINDERS] Successfully generated check-in reminder schedule");
          return true;
        } else {
          console.error("[ENSURE-REMINDERS] Failed to generate check-in reminder schedule");
          return false;
        }
      } catch (checkInError) {
        console.error("[ENSURE-REMINDERS] Error generating check-in reminder schedule:", checkInError);
        return false;
      }
    } else {
      // For standard conditions, use the regular generator
      // Calculate effective deadline based on condition type
      const effectiveDeadline = getEffectiveDeadline(condition);
      
      if (!effectiveDeadline) {
        console.warn("[ENSURE-REMINDERS] Could not determine deadline for condition");
        return false;
      }
      
      console.log(`[ENSURE-REMINDERS] Determined deadline: ${effectiveDeadline.toISOString()}`);
      
      // Generate standard reminder schedule
      try {
        const result = await generateReminderSchedule(
          messageId,
          conditionId,
          effectiveDeadline,
          reminderMinutes,
          isEdit // Pass the isEdit flag to prevent immediate notifications
        );
        
        if (result) {
          console.log("[ENSURE-REMINDERS] Successfully generated standard reminder schedule");
          return true;
        } else {
          console.error("[ENSURE-REMINDERS] Failed to generate standard reminder schedule");
          return false;
        }
      } catch (scheduleError) {
        console.error("[ENSURE-REMINDERS] Error generating standard reminder schedule:", scheduleError);
        
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
                action: "regenerate-schedule",
                isEdit: isEdit // Pass isEdit flag to prevent immediate notifications
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
    }
  } catch (error) {
    console.error("[ENSURE-REMINDERS] Error ensuring reminder schedule:", error);
    return false;
  }
}
