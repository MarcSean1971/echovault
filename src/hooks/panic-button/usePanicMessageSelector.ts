
import { useState } from "react";

/**
 * Hook for managing panic message selection
 */
export function usePanicMessageSelector(
  startCountdownFn: Function
) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Handle message selection from the selector dialog
  const handlePanicMessageSelect = (messageId: string) => {
    console.log(`Selected panic message: ${messageId}`);
    setSelectedMessageId(messageId);
    setIsSelectorOpen(false);
    
    // After selecting a message, proceed with starting the countdown
    startCountdownFn();
  };

  return {
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    handlePanicMessageSelect
  };
}
