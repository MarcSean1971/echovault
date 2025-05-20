
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
 * FIXED: Added better error handling and logging for improved debugging of permission issues
 * CRITICAL FIX: Added proper handling of reminderMinutes values in all formats
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
    
    // CRITICAL FIX: Log the raw reminder_hours value from database for debugging
    console.log("[ENSURE-REMINDERS] Raw reminder_hours from database:", condition.reminder_hours);
    
    // First mark existing reminders as obsolete
    try {
      console.log(`[ENSURE-REMINDERS] Marking existing reminders as obsolete for message ${messageId}`);
      await markRemindersAsObsolete(messageId, conditionId);
    } catch (obsoleteError) {
      console.error("[ENSURE-REMINDERS] Error marking reminders as obsolete:", obsoleteError);
      // Continue execution to attempt creating new reminders even if marking obsolete fails
    }
    
    // Get reminder times (already in minutes in the database)
    // CRITICAL FIX: Ensure we properly handle the reminder_hours value regardless of format
    let reminderMinutes = [];
    
    if (condition.reminder_hours) {
      // Handle both number[] and string[] formats
      if (Array.isArray(condition.reminder_hours)) {
        reminderMinutes = condition.reminder_hours.map(Number);
      } else {
        // Try to parse as JSON if it's a string
        try {
          const parsed = JSON.parse(condition.reminder_hours);
          reminderMinutes = Array.isArray(parsed) ? parsed.map(Number) : [];
        } catch (e) {
          // If parsing fails, use parseReminderMinutes as fallback
          reminderMinutes = parseReminderMinutes(condition.reminder_hours);
        }
      }
    } else {
      // Default to 24 hours (1440 minutes) if no reminders are set
      reminderMinutes = [1440]; 
    }
    
    console.log("[ENSURE-REMINDERS] Parsed reminder minutes:", reminderMinutes);
    
    // Calculate effective deadline based on condition type
    const effectiveDeadline = getEffectiveDeadline(condition);
    
    if (!effectiveDeadline) {
      console.warn("[ENSURE-REMINDERS] Could not determine deadline for condition");
      return false;
    }
    
    console.log(`[ENSURE-REMINDERS] Determined deadline: ${effectiveDeadline.toISOString()}`);
    console.log(`[ENSURE-REMINDERS] Using reminder minutes: ${JSON.stringify(reminderMinutes)}`);
    
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
