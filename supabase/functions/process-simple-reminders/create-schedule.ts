
import { supabaseClient } from "./supabase-client.ts";

export async function createReminderSchedule(params: any): Promise<boolean> {
  try {
    console.log("[CREATE-SCHEDULE] Creating reminder schedule server-side:", params);
    
    const supabase = supabaseClient();
    const { messageId, conditionId, conditionType, reminderMinutes, triggerDate, lastChecked, hoursThreshold, minutesThreshold } = params;
    
    // CRITICAL: Reject panic triggers at server level
    if (conditionType === 'panic_trigger') {
      console.log("[CREATE-SCHEDULE] REJECTING panic trigger - panic triggers do not have reminder schedules!");
      return false;
    }
    
    // Calculate deadline
    let deadline: Date | null = null;
    const now = new Date();
    
    if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold !== undefined || minutesThreshold !== undefined)) {
      const lastCheckedDate = new Date(lastChecked);
      deadline = new Date(lastCheckedDate);
      
      if (hoursThreshold) {
        deadline.setHours(deadline.getHours() + hoursThreshold);
      }
      
      if (minutesThreshold) {
        deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
      }
      
      console.log(`[CREATE-SCHEDULE] Check-in deadline: ${deadline.toISOString()}`);
    } else if (triggerDate) {
      deadline = new Date(triggerDate);
      console.log(`[CREATE-SCHEDULE] Trigger deadline: ${deadline.toISOString()}`);
    }
    
    if (!deadline) {
      console.error("[CREATE-SCHEDULE] No valid deadline calculated");
      return false;
    }
    
    const scheduleEntries = [];
    const validReminderMinutes = Array.isArray(reminderMinutes) ? reminderMinutes : [60]; // Default to 1 hour
    
    // If deadline has passed, create immediate entries
    if (deadline <= now) {
      console.log(`[CREATE-SCHEDULE] Deadline has passed! Creating IMMEDIATE entries`);
      
      if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType)) {
        scheduleEntries.push({
          message_id: messageId,
          condition_id: conditionId,
          scheduled_at: new Date(now.getTime() + 10000).toISOString(),
          reminder_type: 'reminder',
          status: 'pending',
          delivery_priority: 'critical',
          retry_strategy: 'aggressive'
        });
      }
      
      scheduleEntries.push({
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: new Date(now.getTime() + 30000).toISOString(),
        reminder_type: 'final_delivery',
        status: 'pending',
        delivery_priority: 'critical',
        retry_strategy: 'aggressive'
      });
    } else {
      // Create normal schedule for future deadlines
      for (const minutes of validReminderMinutes) {
        const reminderTime = new Date(deadline.getTime() - (minutes * 60 * 1000));
        
        if (reminderTime > now) {
          scheduleEntries.push({
            message_id: messageId,
            condition_id: conditionId,
            scheduled_at: reminderTime.toISOString(),
            reminder_type: 'reminder',
            status: 'pending',
            delivery_priority: 'normal',
            retry_strategy: 'standard'
          });
        }
      }
      
      // Add final delivery
      scheduleEntries.push({
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: deadline.toISOString(),
        reminder_type: 'final_delivery',
        status: 'pending',
        delivery_priority: 'high',
        retry_strategy: 'standard'
      });
    }
    
    if (scheduleEntries.length === 0) {
      console.warn("[CREATE-SCHEDULE] No schedule entries to create");
      return false;
    }
    
    console.log(`[CREATE-SCHEDULE] Creating ${scheduleEntries.length} schedule entries`);
    
    // Insert the schedule entries
    const { data, error } = await supabase
      .from('reminder_schedule')
      .insert(scheduleEntries)
      .select();
    
    if (error) {
      console.error("[CREATE-SCHEDULE] Error inserting reminder schedule:", error);
      return false;
    }
    
    console.log(`[CREATE-SCHEDULE] Successfully created ${data?.length || 0} reminder entries`);
    return true;
    
  } catch (error: any) {
    console.error("[CREATE-SCHEDULE] Error in createReminderSchedule:", error);
    return false;
  }
}
