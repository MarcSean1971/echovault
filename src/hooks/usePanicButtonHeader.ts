
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { triggerPanicMessageWithCallbacks } from "./panic-button/triggerUtils";

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

    // If confirming, we'll open the selector for multiple messages
    // or navigate to the panic button page for a single message
    if (isConfirming) {
      setIsSelectorOpen(true);
      return;
    }
    
    // First press, just show confirmation
    setIsConfirming(true);
    
    // Auto-reset confirmation state if not clicked again
    setTimeout(() => {
      setIsConfirming(false);
    }, 3000);
  };
  
  // Handle panic message selection - now directly triggers the message
  const handlePanicMessageSelect = (messageId: string) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to trigger an emergency message.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedMessageId(messageId);
    setIsSelectorOpen(false);
    setTriggerInProgress(true);
    setPanicMode(true);
    
    // Show immediate toast for user feedback
    toast({
      title: "EMERGENCY ALERT",
      description: "Triggering your emergency message...",
      variant: "destructive"
    });
    
    // Directly trigger the panic message
    triggerPanicMessageWithCallbacks(userId, messageId, {
      maxRetries: 1,
      onSuccess: (result) => {
        // Start a countdown for visual feedback
        let count = 3;
        setCountDown(count);
        
        const countdownInterval = setInterval(() => {
          count--;
          setCountDown(count);
          
          if (count <= 0) {
            clearInterval(countdownInterval);
            setPanicMode(false);
            setIsConfirming(false);
            setTriggerInProgress(false);
            
            // Navigate to messages page after successful trigger instead of check-in
            navigate('/messages');
          }
        }, 1000);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('panic-trigger-executed', { 
          detail: { 
            messageId,
            triggered: true,
            timestamp: new Date().toISOString()
          }
        }));
      },
      onError: (error) => {
        console.error("Error triggering panic message:", error);
        setPanicMode(false);
        setTriggerInProgress(false);
        
        toast({
          title: "Error",
          description: "Failed to trigger emergency message. Please try again.",
          variant: "destructive"
        });
      }
    });
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
