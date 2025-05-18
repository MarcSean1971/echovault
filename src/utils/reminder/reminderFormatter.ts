
/**
 * Functions for formatting reminder data for display
 */
import { format } from "date-fns";

/**
 * Format reminder schedule for display
 */
export function formatReminderSchedule(schedule: { scheduledAt: Date, reminderType: string, priority?: string }[]): string[] {
  // Ensure we have a valid array to work with
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return [];
  }
  
  return schedule.map(item => {
    // Verify the scheduledAt property is a valid Date object
    if (!(item.scheduledAt instanceof Date) || isNaN(item.scheduledAt.getTime())) {
      console.error("Invalid date encountered in formatReminderSchedule:", item.scheduledAt);
      return `Invalid date (${item.reminderType})`;
    }
    
    try {
      const formattedTime = format(item.scheduledAt, "MMM d, yyyy h:mm a");
      const typeName = item.reminderType === 'reminder' ? 'Reminder' : 
                      (item.reminderType === 'final_delivery' ? 'Final Delivery' : item.reminderType);
      const priorityFlag = item.priority === 'critical' ? ' (Critical)' : '';
      
      return `${formattedTime} (${typeName}${priorityFlag})`;
    } catch (error) {
      console.error("Error formatting date in reminderFormatter:", error);
      return `Error formatting date (${item.reminderType})`;
    }
  });
}
