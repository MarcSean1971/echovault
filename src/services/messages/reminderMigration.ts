
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "./reminder"; // Changed from ./reminderService to ./reminder
import { parseReminderMinutes } from "@/utils/reminderUtils";

/**
 * Migrate all existing message conditions to the new reminder schedule system
 */
export async function migrateAllMessageSchedules(): Promise<{
  total: number;
  success: number;
  failed: number;
}> {
  try {
    console.log("Starting migration of all message conditions to new reminder schedule system");
    
    const { data: conditions, error } = await supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        condition_type,
        trigger_date,
        reminder_hours,
        last_checked,
        hours_threshold,
        minutes_threshold,
        active
      `)
      .eq('active', true);
    
    if (error) throw error;
    
    if (!conditions || conditions.length === 0) {
      console.log("No active conditions found to migrate");
      return { total: 0, success: 0, failed: 0 };
    }
    
    console.log(`Found ${conditions.length} active conditions to migrate`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const condition of conditions) {
      try {
        const reminderMinutes = parseReminderMinutes(condition.reminder_hours);
        
        const result = await createOrUpdateReminderSchedule({
          messageId: condition.message_id,
          conditionId: condition.id,
          conditionType: condition.condition_type,
          triggerDate: condition.trigger_date,
          reminderMinutes,
          lastChecked: condition.last_checked,
          hoursThreshold: condition.hours_threshold,
          minutesThreshold: condition.minutes_threshold
        });
        
        if (result) {
          successCount++;
          console.log(`Successfully migrated condition ${condition.id} for message ${condition.message_id}`);
        } else {
          failedCount++;
          console.error(`Failed to migrate condition ${condition.id} for message ${condition.message_id}`);
        }
      } catch (conditionError) {
        failedCount++;
        console.error(`Error migrating condition ${condition.id}:`, conditionError);
      }
    }
    
    console.log(`Migration complete. Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
      total: conditions.length,
      success: successCount,
      failed: failedCount
    };
  } catch (error) {
    console.error("Error in migrateAllMessageSchedules:", error);
    return { total: 0, success: 0, failed: 0 };
  }
}

/**
 * Migrate a single message's reminder schedule
 */
export async function migrateMessageSchedule(messageId: string): Promise<boolean> {
  try {
    console.log(`Migrating reminder schedule for message ${messageId}`);
    
    const { data: condition, error } = await supabase
      .from('message_conditions')
      .select(`
        id,
        condition_type,
        trigger_date,
        reminder_hours,
        last_checked,
        hours_threshold,
        minutes_threshold
      `)
      .eq('message_id', messageId)
      .eq('active', true)
      .single();
    
    if (error) {
      console.error(`Error fetching condition for message ${messageId}:`, error);
      return false;
    }
    
    if (!condition) {
      console.log(`No active condition found for message ${messageId}`);
      return false;
    }
    
    const reminderMinutes = parseReminderMinutes(condition.reminder_hours);
    
    return await createOrUpdateReminderSchedule({
      messageId,
      conditionId: condition.id,
      conditionType: condition.condition_type,
      triggerDate: condition.trigger_date,
      reminderMinutes,
      lastChecked: condition.last_checked,
      hoursThreshold: condition.hours_threshold,
      minutesThreshold: condition.minutes_threshold
    });
  } catch (error) {
    console.error(`Error migrating reminder schedule for message ${messageId}:`, error);
    return false;
  }
}
