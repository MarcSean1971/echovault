
/**
 * Helper to check if a condition type is a check-in related condition
 */
export function isCheckInCondition(conditionType: string): boolean {
  const checkInTypes = [
    'recurring_check_in',
    'no_check_in',
    'inactivity_to_date',
    'inactivity_to_recurring',
    'group_confirmation'
  ];
  
  return checkInTypes.includes(conditionType);
}
