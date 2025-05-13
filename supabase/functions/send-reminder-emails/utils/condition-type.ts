
/**
 * Check if the condition is a check-in related condition
 */
export function isCheckInCondition(conditionType: string): boolean {
  return ['recurring_check_in', 'no_check_in', 'inactivity_to_date'].includes(conditionType);
}
