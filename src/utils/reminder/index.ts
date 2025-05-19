
/**
 * Main reminder utility module that exports all reminder functionality
 * This file provides a unified interface to the reminder system
 */

// Export the reminder creation utilities
export { generateReminderSchedule } from './generators/coreGenerator';
export { calculateNextReminderTime } from './reminderCalculator';
export { markRemindersAsObsolete } from './reminderUtils';
export { formatReminderDate, formatScheduledReminderTime, parseReminderMinutes } from '../reminderUtils';

// Export formatters
export { formatReminderSchedule } from './reminderFormatter';

// Export batch reminder fetcher
export { getUpcomingRemindersForMultipleMessages } from './reminderFetcher';

// Do not export from hooks - this causes circular dependencies
// export * from '../hooks/reminder';
