
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

/**
 * Snap minutes to 15-minute intervals (0, 15, 30, 45)
 */
export const snapMinutesTo15MinInterval = (minutes: number): number => {
  return Math.round(minutes / 15) * 15 % 60;
};

/**
 * Check if a minutes value is at a 15-minute interval (0, 15, 30, 45)
 */
export const isValidMinuteInterval = (minutes: number): boolean => {
  return minutes % 15 === 0;
};

/**
 * Snap a total minutes value to the nearest 15-minute interval
 */
export const snapTotalMinutesTo15MinInterval = (totalMinutes: number): number => {
  // Get hours and remaining minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Round minutes to nearest 15-minute interval
  const snappedMinutes = snapMinutesTo15MinInterval(minutes);
  
  // Return total minutes with snapped minutes
  return (hours * 60) + snappedMinutes;
};

/**
 * Get valid minute options (0, 15, 30, 45)
 */
export const getValidMinuteOptions = (): number[] => {
  return [0, 15, 30, 45];
};

/**
 * Check if a total minutes value is at a valid 15-minute interval
 */
export const isTotalMinutesValid = (totalMinutes: number): boolean => {
  return totalMinutes % 15 === 0;
};
