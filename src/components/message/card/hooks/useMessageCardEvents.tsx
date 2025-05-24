
import { useEffect } from "react";
import { triggerDeadmanSwitch } from "@/services/messages/whatsApp";
import { toast } from "@/hooks/use-toast";

interface UseMessageCardEventsProps {
  messageId: string;
  message: {
    id: string;
    title: string;
  };
  isArmed: boolean;
  deadline: Date | null;
  condition: any;
  isDeadmansSwitch: boolean;
  setLocalReminderRefreshCounter: (fn: (prev: number) => number) => void;
}

export function useMessageCardEvents({
  messageId,
  message,
  isArmed,
  deadline,
  condition,
  isDeadmansSwitch,
  setLocalReminderRefreshCounter
}: UseMessageCardEventsProps) {
  // Listen for deadline-reached events and handle automatic delivery
  useEffect(() => {
    const handleDeadlineReached = async (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { deadlineTime, currentTime } = event.detail || {};
      
      // Check if this deadline event is relevant to this message
      if (!isArmed || !deadline || !condition) return;
      
      const messageDeadlineTime = deadline.getTime();
      
      // Check if the deadline matches this message (within 5 seconds tolerance)
      if (Math.abs(messageDeadlineTime - deadlineTime) > 5000) return;
      
      console.log(`[MessageCard ${message.id}] Deadline reached, triggering automatic delivery`);
      
      try {
        // Show immediate feedback to user
        toast({
          title: "Message Deadline Reached",
          description: `Automatically delivering message: ${message.title}`,
          duration: 5000,
        });
        
        // Trigger automatic message delivery
        if (condition.condition_type === 'no_check_in' || isDeadmansSwitch) {
          await triggerDeadmanSwitch(message.id);
        }
        
        // Force refresh the message condition data
        setLocalReminderRefreshCounter(prev => prev + 1);
        
        // Emit a global event to refresh all related components
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            messageId: message.id,
            conditionId: condition.id,
            action: 'deadline-reached',
            source: 'automatic-delivery',
            timestamp: new Date().toISOString()
          }
        }));
        
      } catch (error) {
        console.error(`[MessageCard ${message.id}] Error during automatic delivery:`, error);
        toast({
          title: "Delivery Error",
          description: "Failed to automatically deliver message. Please check manually.",
          variant: "destructive",
          duration: 8000,
        });
      }
    };
    
    window.addEventListener('deadline-reached', handleDeadlineReached);
    
    return () => {
      window.removeEventListener('deadline-reached', handleDeadlineReached);
    };
  }, [message.id, isArmed, deadline, condition, message.title, isDeadmansSwitch, setLocalReminderRefreshCounter]);
  
  // Listen for specific reminder updates for this card
  useEffect(() => {
    const handleReminderUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId: eventMessageId } = event.detail || {};
      
      // Only update if this event is for this specific message
      if (eventMessageId === messageId) {
        console.log(`[MessageCard ${messageId}] Received reminder update event, refreshing`);
        setLocalReminderRefreshCounter(prev => prev + 1);
      }
    };
    
    // Listen for both general and specific events
    window.addEventListener('message-reminder-updated', handleReminderUpdate);
    window.addEventListener('conditions-updated', handleReminderUpdate);
    
    return () => {
      window.removeEventListener('message-reminder-updated', handleReminderUpdate);
      window.removeEventListener('conditions-updated', handleReminderUpdate);
    };
  }, [messageId, setLocalReminderRefreshCounter]);
}
