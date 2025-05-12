
/**
 * Utility functions for converting between different time formats
 */

/**
 * Converts minutes to hours and minutes
 */
export const minutesToHoursAndMinutes = (totalMinutes: number): { hours: number, minutes: number } => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

/**
 * Converts hours and minutes to total minutes
 */
export const hoursMinutesToMinutes = (hours: number, minutes: number): number => {
  return (hours * 60) + minutes;
};

/**
 * Format a minute value into a human-readable string
 */
export const formatReminderTime = (minutes: number): string => {
  const { hours, minutes: mins } = minutesToHoursAndMinutes(minutes);
  
  if (hours === 0) {
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  } else if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
};

/**
 * Format a threshold in minutes for display in error messages and labels
 */
export const formatThreshold = (totalMinutes: number): string => {
  return formatReminderTime(totalMinutes);
};
