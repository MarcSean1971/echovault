
/**
 * Utility functions for handling reminder timestamps
 * FIXED: Improved handling of different data types
 */

/**
 * Convert hours to human readable format (hours or days)
 */
export function formatReminderDate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) {
    const hours = minutes / 60;
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = minutes / 1440;
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

/**
 * Format a scheduled reminder time for display
 */
export function formatScheduledReminderTime(reminderMinutes: number): string {
  return `${formatReminderDate(reminderMinutes)} before delivery`;
}

/**
 * Parse reminder minutes from various formats
 * ENHANCED: Improved parsing of different data types
 */
export function parseReminderMinutes(input: any): number[] {
  // If already an array, ensure all elements are numbers
  if (Array.isArray(input)) {
    console.log("[parseReminderMinutes] Input is already an array:", input);
    return input.map(Number).filter(num => !isNaN(num));
  }
  
  // If the input is a string, try to parse as JSON
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        console.log("[parseReminderMinutes] Successfully parsed JSON array:", parsed);
        return parsed.map(Number).filter(num => !isNaN(num));
      } else if (typeof parsed === 'number') {
        console.log("[parseReminderMinutes] Parsed single number from JSON:", parsed);
        return [parsed];
      }
    } catch (e) {
      // Not valid JSON, try to parse as a single number
      const num = Number(input);
      if (!isNaN(num)) {
        console.log("[parseReminderMinutes] Parsed single number from string:", num);
        return [num];
      }
    }
  }
  
  // If input is a number, return as a single-element array
  if (typeof input === 'number' && !isNaN(input)) {
    console.log("[parseReminderMinutes] Input is a number:", input);
    return [input];
  }
  
  // Default to 24 hours (1440 minutes) if parsing fails
  console.log("[parseReminderMinutes] Could not parse input, using default:", input);
  return [1440];
}
