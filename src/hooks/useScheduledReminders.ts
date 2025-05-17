
// This file is kept for backward compatibility
// It re-exports from the new modular structure

import { useScheduledReminders as useRefactoredScheduledReminders } from './reminder/useScheduledReminders';
import { ScheduledReminderInfo } from './reminder/types';

export interface { ScheduledReminderInfo };
export { useRefactoredScheduledReminders as useScheduledReminders };
