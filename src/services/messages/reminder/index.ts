
/**
 * Main entry point for the reminder service
 * Re-exports all functionality from the sub-modules
 */

// Export types
export * from "./types";

// Export schedule functionality
export { createOrUpdateReminderSchedule } from "./scheduleService";

// Export fetch functionality
export { getReminderScheduleForMessage, getReminderHistory } from "./fetchService";

// Export testing functionality
export { testReminderTrigger } from "./testService";

// Export utility functions
export { markRemindersAsObsolete } from "./utils";

// Re-export the WhatsApp-specific functionality
export { triggerManualReminder } from "../whatsApp/core/reminderService";
