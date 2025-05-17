
/**
 * Main reminder scheduler interface - delegates to specialized modules
 */
import { getUpcomingReminders, getUpcomingRemindersForMultipleMessages } from './reminderFetcher';
import { generateReminderSchedule, generateCheckInReminderSchedule } from './reminderGenerator';
import { formatReminderSchedule } from './reminderFormatter';
import { markExistingRemindersObsolete } from './reminderUtils';

// Re-export everything for backward compatibility
export {
  getUpcomingReminders,
  getUpcomingRemindersForMultipleMessages,
  generateReminderSchedule,
  generateCheckInReminderSchedule,
  formatReminderSchedule,
  markExistingRemindersObsolete
};
