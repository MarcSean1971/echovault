
import { hoursMinutesToMinutes } from "../TimeConversionUtils";

/**
 * Validates if a reminder time is valid based on various criteria
 */
export function validateReminderTime(
  hourValue: number, 
  minuteValue: number, 
  existingReminders: number[],
  maxMinutes?: number
): { isValid: boolean; error: string | null } {
  const totalMinutes = hoursMinutesToMinutes(hourValue, minuteValue);
  
  // Validate that we have at least some time value
  if (hourValue === 0 && minuteValue === 0) {
    return { isValid: false, error: "Please enter a reminder time" };
  }
  
  // Validate that minutes are on a 15-minute interval
  if (minuteValue % 15 !== 0) {
    return { 
      isValid: false, 
      error: "Minutes must be in 15-minute intervals (0, 15, 30, 45)" 
    };
  }
  
  // If maxMinutes is provided, ensure the combined value is less than it
  if (maxMinutes && totalMinutes >= maxMinutes) {
    return { 
      isValid: false, 
      error: `Reminder time must be less than the check-in threshold (${Math.floor(maxMinutes / 60)} hours and ${maxMinutes % 60} minutes)` 
    };
  }
  
  // Check if this time already exists in the array
  if (existingReminders.includes(totalMinutes)) {
    return { isValid: false, error: "This reminder time already exists" };
  }
  
  return { isValid: true, error: null };
}
