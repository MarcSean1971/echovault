
/**
 * Get timer color based on percentage and urgency
 */
export const getTimerColor = (
  isArmed: boolean, 
  timePercentage: number, 
  isUrgent: boolean, 
  isVeryUrgent: boolean
): string => {
  if (!isArmed) return 'bg-gray-300';
  if (timePercentage < 10 || isVeryUrgent) return 'bg-destructive';
  if (timePercentage < 30 || isUrgent) return 'bg-orange-500';
  if (timePercentage < 60) return 'bg-amber-400';
  return 'bg-green-500';
};

/**
 * Get pulse animation class based on urgency
 */
export const getPulseClass = (isArmed: boolean, isUrgent: boolean, isVeryUrgent: boolean): string => {
  if (!isArmed) return '';
  if (isVeryUrgent) return 'animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]';
  if (isUrgent) return 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]';
  return '';
};
