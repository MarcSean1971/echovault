
import { useState, useEffect } from "react";
import { MessageCondition } from "@/types/message";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";

export function useMessageCondition(messageId: string) {
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [condition, setCondition] = useState<MessageCondition | null>(null);
  const [isPanicTrigger, setIsPanicTrigger] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load message condition status
  useEffect(() => {
    const loadConditionStatus = async () => {
      try {
        console.log(`[MessageCard] Loading condition for message ID: ${messageId}`);
        const messageCondition = await getConditionByMessageId(messageId);
        
        if (messageCondition) {
          console.log(`[MessageCard] Got condition ID: ${messageCondition.id}, active: ${messageCondition.active}`);
          setCondition(messageCondition);
          setIsArmed(messageCondition.active);
          setIsPanicTrigger(messageCondition.condition_type === 'panic_trigger');
          
          // Get deadline if message is armed
          if (messageCondition.active) {
            const deadlineDate = await getMessageDeadline(messageCondition.id);
            // Create a new Date object to ensure React detects the change
            if (deadlineDate) {
              console.log(`[MessageCard] Got deadline: ${deadlineDate.toISOString()}`);
              setDeadline(new Date(deadlineDate.getTime()));
            } else {
              setDeadline(null);
            }
          }
        }
      } catch (error) {
        console.error("Error loading message condition:", error);
      }
    };
    
    loadConditionStatus();
    
    // Also reload when conditions-updated event is received
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log(`[MessageCard ${messageId}] Received conditions-updated event, reloading with trigger: ${event.detail?.triggerValue || 'unknown'}`);
        loadConditionStatus();
        // Increment refresh counter to force re-render of timer
        setRefreshCounter(prev => prev + 1);
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [messageId]);
  
  return { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    transcription,
    refreshCounter,
    setRefreshCounter
  };
}
