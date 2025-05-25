
/**
 * SIMPLIFIED REMINDER UTILITIES
 * Replaces all the over-engineered reminder calculation logic
 */

/**
 * Simple function to parse reminder hours from condition
 */
export function parseReminderMinutes(reminderHours?: number[]): number[] {
  if (!reminderHours || !Array.isArray(reminderHours)) {
    return [60]; // Default: 1 hour before (in minutes)
  }
  
  return reminderHours.map(hours => {
    if (typeof hours === 'number' && hours > 0) {
      return hours * 60; // Convert hours to minutes
    }
    return 60; // Default fallback
  }).filter(minutes => minutes > 0);
}

/**
 * Format a date for reminder display
 */
export function formatReminderDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return `${diffMinutes} minutes`;
  } else if (diffHours < 24) {
    return `${diffHours} hours`;
  } else {
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days`;
  }
}

/**
 * Format scheduled reminder time for display
 */
export function formatScheduledReminderTime(scheduledAt: string): string {
  const date = new Date(scheduledAt);
  return date.toLocaleString();
}

/**
 * Calculate time until a date
 */
export function getTimeUntil(targetDate: Date): string {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Overdue";
  }
  
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return `${diffDays}d`;
  }
}
