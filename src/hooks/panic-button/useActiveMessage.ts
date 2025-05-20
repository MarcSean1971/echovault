
import { useCallback } from "react";
import { MessageCondition } from "@/types/message";

/**
 * Hook for determining which panic message is active
 */
export function useActiveMessage(
  panicMessage: MessageCondition | null,
  panicMessages: MessageCondition[],
  selectedMessageId: string | null
) {
  // Get active message ID - first selected, then active message, then first in list
  const getActiveMessageId = useCallback(() => {
    if (selectedMessageId) return selectedMessageId;
    if (panicMessage) return panicMessage.message_id;
    if (panicMessages.length > 0) return panicMessages[0].message_id;
    return null;
  }, [panicMessage, panicMessages, selectedMessageId]);
  
  return {
    getActiveMessageId
  };
}
