
/**
 * Utility functions for calculating deadlines and time remaining
 */

export interface DeadlineInfo {
  deadline: Date;
  hoursUntilDeadline: number;
  isOverdue: boolean;
}

/**
 * Calculate deadline for check-in conditions
 */
export function calculateCheckInDeadline(
  lastChecked: string,
  hoursThreshold: number = 24,
  minutesThreshold: number = 0
): DeadlineInfo {
  const lastCheckedDate = new Date(lastChecked);
  const deadline = new Date(lastCheckedDate);
  
  deadline.setHours(deadline.getHours() + hoursThreshold);
  deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
  
  const now = new Date();
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return {
    deadline,
    hoursUntilDeadline,
    isOverdue: hoursUntilDeadline <= 0
  };
}

/**
 * Calculate deadline for scheduled conditions
 */
export function calculateScheduledDeadline(triggerDate: string): DeadlineInfo {
  const deadline = new Date(triggerDate);
  const now = new Date();
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return {
    deadline,
    hoursUntilDeadline,
    isOverdue: hoursUntilDeadline <= 0
  };
}
