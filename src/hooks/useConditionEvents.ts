
// Legacy hook that now uses the optimized version
// Kept for backward compatibility

import { useOptimizedConditionEvents } from './useOptimizedConditionEvents';

interface UseConditionEventsProps {
  messageId: string;
  onConditionsUpdated: () => void;
  enabled?: boolean;
}

/**
 * @deprecated Use useOptimizedConditionEvents instead
 * This hook is kept for backward compatibility
 */
export function useConditionEvents({
  messageId,
  onConditionsUpdated,
  enabled = true
}: UseConditionEventsProps) {
  console.warn('[useConditionEvents] This hook is deprecated, consider using useOptimizedConditionEvents');
  
  return useOptimizedConditionEvents({
    messageId,
    onConditionsUpdated,
    enabled
  });
}
