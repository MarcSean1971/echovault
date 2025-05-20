
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

/**
 * A lightweight version of usePanicButton that doesn't
 * perform heavy database operations until needed
 */
export function usePanicButtonHeader(userId: string | null | undefined) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  // Check if we have an active cancel window based on countDown
  const inCancelWindow = panicMode && countDown > 0;

  // Handle panic button click with minimal processing
  const handlePanicButtonClick = () => {
    if (inCancelWindow) {
      // If in cancel window, cancel the panic trigger
      setPanicMode(false);
      setIsConfirming(false);
      setTriggerInProgress(false);
      setCountDown(0);
      
      toast({
        title: "Emergency alert cancelled",
        description: "Your emergency message has been cancelled."
      });
      
      return;
    }
    
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to use the panic button.",
        variant: "destructive"
      });
      return;
    }

    // If confirming, we'll just redirect to the panic button page
    // This avoids heavy location checking in the header
    if (isConfirming) {
      navigate('/check-in');
      return;
    }
    
    // First press, just show confirmation
    setIsConfirming(true);
    
    // Auto-reset confirmation state if not clicked again
    setTimeout(() => {
      setIsConfirming(false);
    }, 3000);
  };
  
  // Handle panic message selection
  const handlePanicMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    navigate('/check-in');
  };

  return {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    handlePanicButtonClick,
    handlePanicMessageSelect,
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    inCancelWindow
  };
}
