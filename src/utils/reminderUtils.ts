/**
 * Utility functions for reminder calculations
 */

import { formatDistanceToNow, formatRelative, isAfter, addMinutes, addHours, isBefore, format } from "date-fns";

/**
 * Calculate all upcoming reminders based on a deadline and reminder configuration
 * @param deadline The deadline date for the message
 * @param reminderMinutes Array of reminder times in minutes before the deadline
 * @returns Array of upcoming reminder dates sorted by closest first
 */
export function calculateUpcomingReminders(
  deadline: Date | null, 
  reminderMinutes: number[] = []
): Date[] {
  if (!deadline || reminderMinutes.length === 0) {
    return [];
  }

  const now = new Date();
  const upcomingReminders: Date[] = [];

  // Calculate reminder dates by subtracting reminder minutes from deadline
  reminderMinutes.forEach(minutes => {
    // Convert minutes to milliseconds
    const reminderDate = new Date(deadline.getTime() - (minutes * 60 * 1000));
    
    // Only include future reminders
    if (isAfter(reminderDate, now)) {
      upcomingReminders.push(reminderDate);
    }
  });

  // Sort reminders by the closest ones first
  return upcomingReminders.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Format a reminder date for display
 * @param reminderDate The reminder date to format
 * @returns Formatted string like "in 2 hours"
 */
export function formatReminderDate(reminderDate: Date): string {
  return formatDistanceToNow(reminderDate, { addSuffix: true });
}

/**
 * Format a reminder time with specific formatting
 */
export function formatReminderTime(reminderDate: Date): string {
  return format(reminderDate, "h:mm a");
}

/**
 * Format a reminder date in short format
 * @param reminderDate The reminder date to format
 * @returns Formatted string like "May 15, 4:30 PM"
 */
export function formatReminderShortDate(reminderDate: Date): string {
  return format(reminderDate, "MMM d, h:mm a");
}

/**
 * Get display text for next reminder
 */
export function getNextReminderText(deadline: Date | null, reminderMinutes: number[] = []): string | null {
  const upcomingReminders = calculateUpcomingReminders(deadline, reminderMinutes);
  
  if (upcomingReminders.length === 0) {
    return null;
  }
  
  const nextReminder = upcomingReminders[0];
  return formatReminderDate(nextReminder);
}

/**
 * Format all upcoming reminders as an array of strings
 */
export function getAllUpcomingReminderTexts(deadline: Date | null, reminderMinutes: number[] = []): string[] {
  const upcomingReminders = calculateUpcomingReminders(deadline, reminderMinutes);
  
  return upcomingReminders.map(date => formatReminderDate(date));
}

/**
 * Convert reminder_hours from database to an array of minutes
 * IMPORTANT: Despite the misleading column name 'reminder_hours',
 * values are actually stored in minutes in the database
 */
export function parseReminderMinutes(reminderHours: number[] | null | undefined): number[] {
  if (!reminderHours || !Array.isArray(reminderHours)) {
    return [];
  }
  
  // Values are already in minutes, return directly
  return reminderHours;
}

/**
 * Calculate if a deadline date has already passed
 */
export function isDeadlinePassed(deadline: Date | null): boolean {
  if (!deadline) return false;
  return isBefore(deadline, new Date());
}

/**
 * Format a scheduled reminder time for display
 */
export function formatScheduledReminderTime(scheduledFor: string | null | undefined): string {
  if (!scheduledFor) return "Unknown";
  
  try {
    return formatDistanceToNow(new Date(scheduledFor), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting scheduled reminder time:", error);
    return "Invalid date";
  }
}

/**
 * Get effective deadline for a condition, handling check-in conditions specially
 * @param condition The message condition object
 * @returns Calculated deadline as a Date object, or null if it can't be determined
 */
export function getEffectiveDeadline(condition: any): Date | null {
  if (!condition) return null;

  // For regular conditions with a trigger_date, use that
  if (condition.trigger_date) {
    return new Date(condition.trigger_date);
  }
  
  // For check-in type conditions, calculate based on last_checked + threshold
  if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
    if (condition.last_checked && (condition.hours_threshold || condition.minutes_threshold)) {
      const lastChecked = new Date(condition.last_checked);
      const hoursToAdd = condition.hours_threshold || 0;
      const minutesToAdd = condition.minutes_threshold || 0;
      
      const deadline = new Date(lastChecked);
      deadline.setHours(deadline.getHours() + hoursToAdd);
      deadline.setMinutes(deadline.getMinutes() + minutesToAdd);
      
      return deadline;
    }
  }
  
  return null;
}
