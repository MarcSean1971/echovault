
import { useActionState } from "./useActionState";
import { useArmOperations } from "./useArmOperations";
import { useDisarmOperations } from "./useDisarmOperations";

/**
 * Hook for handling message card arming/disarming actions
 * Optimized for performance when used from card views
 */
export function useMessageCardActions() {
  const { isLoading, setIsLoading } = useActionState();
  const { armMessage } = useArmOperations();
  const { disarmMessage } = useDisarmOperations();
  
  const handleArmMessage = async (conditionId: string): Promise<Date | null> => {
    setIsLoading(true);
    try {
      return await armMessage(conditionId);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisarmMessage = async (conditionId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await disarmMessage(conditionId);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    handleArmMessage,
    handleDisarmMessage
  };
}

// Re-export the main hook as default
export default useMessageCardActions;
