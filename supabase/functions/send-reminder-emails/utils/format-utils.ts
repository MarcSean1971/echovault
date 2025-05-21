
/**
 * Utility function to format time until deadline for email notifications
 * Converts hours to a human-readable format
 */
export function formatReminderTime(hoursUntilDeadline: number): string {
  // Handle negative or zero hours
  if (hoursUntilDeadline <= 0) {
    return "soon";
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
  
  // Just hours
  const roundedHours = Math.floor(hoursUntilDeadline);
  return roundedHours === 1 ? "1 hour" : `${roundedHours} hours`;
}
