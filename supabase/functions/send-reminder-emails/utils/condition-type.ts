
/**
 * Check if a condition type is related to check-ins
 */
export function isCheckInCondition(conditionType: string): boolean {
  // List all condition types that are related to check-ins
  const checkInConditionTypes = [
    'recurring_check_in',
    'no_check_in',
    'inactivity_to_date'
  ];
  
  return checkInConditionTypes.includes(conditionType);
}

/**
 * Check if a condition should trigger messages to all recipients
 */
export function shouldNotifyAllRecipients(conditionType: string): boolean {
  // All conditions except check-in conditions should notify all recipients
  return !isCheckInCondition(conditionType);
}

/**
 * Check if a condition is a deadman's switch
 */
export function isDeadmanSwitch(conditionType: string): boolean {
  return conditionType === 'no_check_in';
}

/**
 * Check if a condition is a panic trigger
 */
export function isPanicTrigger(conditionType: string): boolean {
  return conditionType === 'panic_trigger';
}

/**
 * Get priority level for a condition type
 * Higher number = higher priority
 */
export function getConditionPriority(conditionType: string): number {
  switch (conditionType) {
    case 'panic_trigger':
      return 10; // Highest priority
    case 'no_check_in':
      return 8;
    case 'inactivity_to_date':
      return 7;
    case 'recurring_check_in':
      return 5;
    case 'date_trigger':
      return 3;
    default:
      return 1;
  }
}
