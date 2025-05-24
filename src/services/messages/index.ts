
/**
 * Main entry point for the message services
 * Initializes monitoring and exports all functionality
 */

// Initialize notification monitoring
import { notificationMonitor } from './monitoring/notificationMonitor';

// Start monitoring on service load
if (typeof window !== 'undefined') {
  // Start monitoring after a short delay to ensure system is ready
  setTimeout(() => {
    notificationMonitor.startMonitoring();
  }, 2000);
}

// Export condition services
export * from "./conditionService";

// Export message services
export * from "./messageService";

// Export reminder services - exclude triggerManualReminder to avoid conflict
export { 
  createOrUpdateReminderSchedule,
  getReminderScheduleForMessage, 
  getReminderHistory,
  testReminderTrigger,
  markRemindersAsObsolete
} from "./reminder";

// Export notification services
export * from "./notification";

// Export WhatsApp services (includes triggerManualReminder)
export * from "./whatsApp";

// Export monitoring services
export { notificationMonitor } from './monitoring/notificationMonitor';
