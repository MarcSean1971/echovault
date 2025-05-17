
/**
 * Functions for formatting reminder data for display
 */
import { format } from "date-fns";

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
