
/**
 * Check if a condition type is a check-in related condition
 */
export function isCheckInCondition(conditionType: string): boolean {
  return ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(conditionType);
}

/**
 * Calculate effective deadline for check-in condition
 */
export function calculateCheckInDeadline(
  lastChecked: string,
  hoursThreshold: number,
  minutesThreshold: number = 0
): Date | null {
  if (!lastChecked) return null;
  
  try {
    const lastCheckedDate = new Date(lastChecked);
    const deadline = new Date(lastCheckedDate);
    
    deadline.setHours(deadline.getHours() + hoursThreshold);
    deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
    
    return deadline;
  } catch (error) {
    console.error("Error calculating check-in deadline:", error);
    return null;
  }
}
