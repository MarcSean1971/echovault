
/**
 * SIMPLIFIED: Main reminder utility module
 * Exports only the essential reminder functionality
 */

// Export the core utilities
export { parseReminderMinutes, formatReminderDate, formatScheduledReminderTime, getTimeUntil } from '../reminderUtils';

// Export the simple reminder service
export { createReminderSchedule, getUpcomingReminders, markRemindersObsolete } from '@/services/reminders/simpleReminderService';
