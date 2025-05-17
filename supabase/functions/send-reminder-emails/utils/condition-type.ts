
/**
 * Check if condition is a check-in condition type
 */
export function isCheckInCondition(conditionType: string): boolean {
  return ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(conditionType);
}
