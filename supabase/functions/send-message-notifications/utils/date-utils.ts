
/**
 * Date-related utility functions
 */

/**
 * Calculate dates for delayed access and expiry based on settings
 * @returns Object with relevant date calculations
 */
export function calculateDates(hasDelayedAccess: boolean, hasExpiry: boolean, delayHours?: number, expiryHours?: number) {
  const now = new Date();
  
  const unlockDate = hasDelayedAccess 
    ? new Date(now.getTime() + (delayHours || 0) * 60 * 60 * 1000) 
    : now;
  
  const expiryDate = hasExpiry 
    ? new Date(now.getTime() + (expiryHours || 0) * 60 * 60 * 1000) 
    : null;
  
  return {
    now,
    unlockDate,
    expiryDate
  };
}
