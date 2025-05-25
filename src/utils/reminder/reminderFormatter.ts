
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
      
      // Improved type display with proper capitalization and spacing
      let typeName = item.reminderType;
      if (item.reminderType === 'reminder') {
        typeName = 'Reminder';
      } else if (item.reminderType === 'final_delivery') {
        typeName = 'Final Delivery';
      } else {
        // Convert snake_case to Title Case
        typeName = item.reminderType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // Add priority flag if present
      let priorityFlag = '';
      if (item.priority) {
        if (item.priority === 'critical') {
          priorityFlag = ' (Critical)';
        } else if (item.priority === 'high') {
          priorityFlag = ' (High Priority)';
        }
      }
      
      return `${formattedTime} (${typeName}${priorityFlag})`;
    } catch (error) {
      console.error("Error formatting date in reminderFormatter:", error);
      return `Error formatting date (${item.reminderType})`;
    }
  });
}
