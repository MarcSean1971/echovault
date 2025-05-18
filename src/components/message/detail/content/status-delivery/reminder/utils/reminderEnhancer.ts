
interface EnhancedReminder {
  formattedShortDate: string;
  formattedText: string;
  isImportant: boolean;
  original: string;
}

/**
 * Helper function to enhance string reminders with required properties
 */
export function enhanceReminders(reminders: string[]): EnhancedReminder[] {
  try {
    return reminders.map(reminder => {
      // Extract date and type information from the reminder string
      const isCritical = reminder.toLowerCase().includes('critical');
      const hasTimeInfo = reminder.includes('(');
      
      // Create a short date format from the full reminder text
      let shortDate = reminder;
      if (hasTimeInfo) {
        // Extract the date part before parentheses for short display
        shortDate = reminder.split('(')[0].trim();
      }
      
      return {
        original: reminder,
        formattedShortDate: shortDate,
        formattedText: reminder,
        isImportant: isCritical || reminder.toLowerCase().includes('final delivery')
      };
    });
  } catch (error) {
    console.error("Error enhancing reminders:", error);
    return [];
  }
}
