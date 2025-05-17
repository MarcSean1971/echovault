
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Generate and store reminder schedule for a message
 */
export async function generateReminderSchedule(
  messageId: string,
  conditionId: string,
  triggerDate: Date | null,
  reminderMinutes: number[]
): Promise<boolean> {
  try {
    if (!triggerDate) {
      console.warn(`Cannot generate reminder schedule for message ${messageId} - no trigger date provided`);
      return false;
    }
    
    if (!reminderMinutes || reminderMinutes.length === 0) {
      console.warn(`Cannot generate reminder schedule for message ${messageId} - no reminder minutes provided`);
      return false;
    }
    
    // Generate reminder timestamps
    const scheduleEntries = reminderMinutes.map(minutes => {
      const scheduledAt = new Date(triggerDate.getTime() - (minutes * 60 * 1000));
      return {
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: scheduledAt.toISOString(),
        reminder_type: 'reminder',
        status: 'pending',
        delivery_priority: 'normal',
        retry_strategy: 'standard'
      };
    });
    
    // Add final delivery timestamp with higher priority and robust retry settings
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: triggerDate.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical', // Mark as critical priority
      retry_strategy: 'aggressive' // Use aggressive retry strategy
    });
    
    console.log(`Generated ${scheduleEntries.length} schedule entries for message ${messageId}`);
    
    // Insert schedule entries with conflict handling for idempotency
    const { error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleEntries, {
        onConflict: 'message_id,condition_id,scheduled_at,reminder_type',
        ignoreDuplicates: true
      });
    
    if (error) {
      console.error("Error storing reminder schedule:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in generateReminderSchedule:", error);
    return false;
  }
}

/**
 * Generate schedule for check-in type conditions
 */
export async function generateCheckInReminderSchedule(
  messageId: string,
  conditionId: string,
  lastCheckedDate: Date | null,
  hoursThreshold: number,
  minutesThreshold: number = 0,
  reminderMinutes: number[]
): Promise<boolean> {
  try {
    if (!lastCheckedDate) {
      console.warn(`Cannot generate check-in reminder schedule for message ${messageId} - no last checked date`);
      return false;
    }
    
    // Calculate virtual deadline based on last check-in + threshold
    const virtualDeadline = new Date(lastCheckedDate);
    virtualDeadline.setHours(virtualDeadline.getHours() + hoursThreshold);
    virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesThreshold);
    
    return generateReminderSchedule(messageId, conditionId, virtualDeadline, reminderMinutes);
  } catch (error) {
    console.error("Error in generateCheckInReminderSchedule:", error);
    return false;
  }
}

/**
 * Get upcoming reminders for a message
 */
export async function getUpcomingReminders(messageId: string): Promise<{ 
  scheduledAt: Date, 
  reminderType: string,
  priority?: string 
}[]> {
  try {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('scheduled_at, reminder_type, delivery_priority')
      .eq('message_id', messageId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching upcoming reminders:", error);
      return [];
    }
    
    return (data || []).map(item => ({
      scheduledAt: new Date(item.scheduled_at),
      reminderType: item.reminder_type,
      priority: item.delivery_priority || 'normal'
    }));
  } catch (error) {
    console.error("Error in getUpcomingReminders:", error);
    return [];
  }
}

/**
 * Format reminder schedule for display
 */
export function formatReminderSchedule(schedule: { scheduledAt: Date, reminderType: string, priority?: string }[]): string[] {
  return schedule.map(item => {
    const formattedTime = format(item.scheduledAt, "MMM d, yyyy h:mm a");
    const typeName = item.reminderType === 'reminder' ? 'Reminder' : 
                    (item.reminderType === 'final_delivery' ? 'Final Delivery' : item.reminderType);
    const priorityFlag = item.priority === 'critical' ? ' (Critical)' : '';
    
    return `${formattedTime} (${typeName}${priorityFlag})`;
  });
}
