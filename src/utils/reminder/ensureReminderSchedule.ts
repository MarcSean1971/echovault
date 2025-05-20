
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
 */
export async function ensureReminderSchedule(
  conditionId: string,
  messageId?: string
): Promise<boolean> {
  try {
    console.log(`[ENSURE-REMINDERS] Ensuring reminder schedule for condition ${conditionId}, message ${messageId || 'unknown'}`);
    
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
    
    // FIXED: Improved reminder minutes handling
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
        reminderMinutes = [1440]; // Default to 24 hours as fallback
      }
    } else {
      // Default to 24 hours (1440 minutes) if no reminders are set
      console.log("[ENSURE-REMINDERS] No reminder values found, using default");
      reminderMinutes = [1440];
    }
    
    // Validate all entries are numbers and remove any NaN values
    reminderMinutes = reminderMinutes
      .map(Number)
      .filter(min => !isNaN(min) && min > 0);
      
    // If we ended up with an empty array after filtering, use default
    if (reminderMinutes.length === 0) {
      console.log("[ENSURE-REMINDERS] No valid reminder values after filtering, using default");
      reminderMinutes = [1440];
    }
    
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
        reminderMinutes
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
              forceSend: false,
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
