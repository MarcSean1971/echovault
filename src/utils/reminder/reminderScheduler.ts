
/**
 * Main reminder scheduler interface - delegates to specialized modules
 */
import { getUpcomingRemindersForMultipleMessages } from './reminderFetcher';
import { generateReminderSchedule, generateCheckInReminderSchedule } from './reminderGenerator';
import { formatReminderSchedule } from './reminderFormatter';
import { markRemindersAsObsolete } from './reminderUtils';

// Re-export everything for backward compatibility
export {
  getUpcomingRemindersForMultipleMessages,
  generateReminderSchedule,
  generateCheckInReminderSchedule,
  formatReminderSchedule,
  markRemindersAsObsolete
};
