
/**
 * Utility function to format time until deadline for email notifications
 * Converts hours to a human-readable format
 */
export function formatReminderTime(hoursUntilDeadline: number): string {
  // Handle negative or zero hours
  if (hoursUntilDeadline <= 0) {
    return "soon";
  }

  // For times less than 1 hour, show minutes instead of "0 hours"
  if (hoursUntilDeadline < 1) {
    const minutes = Math.round(hoursUntilDeadline * 60);
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  // Convert hours to days if applicable
  if (hoursUntilDeadline >= 24) {
    const days = Math.floor(hoursUntilDeadline / 24);
    const remainingHours = Math.floor(hoursUntilDeadline % 24);
    
    if (remainingHours === 0) {
      return days === 1 ? "1 day" : `${days} days`;
    }
    
    return days === 1 
      ? `1 day and ${remainingHours} ${remainingHours === 1 ? "hour" : "hours"}`
      : `${days} days and ${remainingHours} ${remainingHours === 1 ? "hour" : "hours"}`;
  }
  
  // Just hours (for values between 1 and 24)
  const roundedHours = Math.floor(hoursUntilDeadline);
  return roundedHours === 1 ? "1 hour" : `${roundedHours} hours`;
}
