
import { useState } from "react";

/**
 * Hook for managing panic message selection
 */
export function usePanicMessageSelector(
  startCountdownFn: (messageId: string) => void
) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Handle message selection from the selector dialog
  const handlePanicMessageSelect = (messageId: string) => {
    console.log(`Selected panic message: ${messageId}`);
    setSelectedMessageId(messageId);
    setIsSelectorOpen(false);
    
    // After selecting a message, proceed with triggering it immediately
    // This ensures the "Trigger Emergency" button works as expected
    startCountdownFn(messageId);
  };

  return {
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    handlePanicMessageSelect
  };
}
