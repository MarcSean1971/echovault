
import { useState, useEffect } from "react";

export function usePanicSendingState(messageId: string) {
  const [isPanicSending, setIsPanicSending] = useState(false);
  const [panicCountDown, setPanicCountDown] = useState(0);
  
  useEffect(() => {
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        // Check if this is a panic trigger event for this message
        if (event.detail?.panicMessageId === messageId) {
          console.log(`[MessageCard ${messageId}] This is the panic message being triggered!`);
          handlePanicSendingState();
        } else if (event.detail?.panicTrigger && isPanicSending) {
          // Reset panic state if another panic was triggered and this one was already in sending state
          setIsPanicSending(false);
          setPanicCountDown(0);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [messageId, isPanicSending]);

  // Handle panic sending state with countdown
  const handlePanicSendingState = () => {
    setIsPanicSending(true);
    let count = 3;
    setPanicCountDown(count);
    
    const interval = setInterval(() => {
      count -= 1;
      setPanicCountDown(count);
      
      if (count <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          setIsPanicSending(false);
        }, 1000); // Keep "SENDING..." displayed for 1 more second after countdown
      }
    }, 1000);
  };
  
  return { isPanicSending, panicCountDown };
}
