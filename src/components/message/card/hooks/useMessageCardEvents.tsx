
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
  // ENHANCED: Listen for deadline-reached events and handle automatic delivery
  useEffect(() => {
    const handleDeadlineReached = async (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { deadlineTime, currentTime } = event.detail || {};
      
      // Check if this deadline event is relevant to this message
      if (!isArmed || !deadline || !condition) return;
      
      const messageDeadlineTime = deadline.getTime();
      
      // Check if the deadline matches this message (within 5 seconds tolerance)
      if (Math.abs(messageDeadlineTime - deadlineTime) > 5000) return;
      
      console.log(`[MessageCard ${message.id}] DEADLINE REACHED - triggering automatic delivery`);
      
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
        
        // CRITICAL: Emit comprehensive delivery completion event
        const deliveryEvent = new CustomEvent('message-delivery-complete', { 
          detail: { 
            messageId: message.id,
            conditionId: condition.id,
            messageTitle: message.title,
            deliveryType: 'automatic',
            reminderType: 'final_delivery',
            action: 'delivery-complete',
            completedAt: new Date().toISOString(),
            source: 'deadline-reached'
          }
        });
        
        window.dispatchEvent(deliveryEvent);
        
        // Also emit as conditions-updated for broader listening
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            messageId: message.id,
            conditionId: condition.id,
            action: 'delivery-complete',
            reminderType: 'final_delivery',
            source: 'deadline-automatic',
            deliveryType: 'automatic',
            timestamp: new Date().toISOString()
          }
        }));
        
        console.log(`[MessageCard ${message.id}] Delivery completion events emitted for automatic delivery`);
        
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
  }, [message.id, isArmed, deadline, condition, message.title, isDeadmansSwitch]);
  
  // ENHANCED: Comprehensive delivery completion event handling
  useEffect(() => {
    const handleDeliveryComplete = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId: eventMessageId, deliveryType, reminderType, action } = event.detail || {};
      
      // Only handle events for this specific message
      if (eventMessageId === messageId) {
        console.log(`[MessageCard ${messageId}] DELIVERY COMPLETION EVENT:`, event.detail);
        
        // IMMEDIATE refresh for any delivery completion
        setLocalReminderRefreshCounter(prev => prev + 1);
        
        // ENHANCED: Different handling based on delivery type
        if (reminderType === 'final_delivery' || action === 'delivery-complete') {
          console.log(`[MessageCard ${messageId}] FINAL DELIVERY COMPLETION - comprehensive reset`);
          
          // Multiple immediate refreshes for final deliveries
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              setLocalReminderRefreshCounter(prev => prev + 1);
            }, i * 50);
          }
          
          // Emit comprehensive reset event for final deliveries
          window.dispatchEvent(new CustomEvent('conditions-updated', { 
            detail: { 
              messageId: messageId,
              conditionId: condition?.id,
              action: 'delivery-complete-reset',
              source: 'final-delivery-completion',
              reminderType: 'final_delivery',
              deliveryType: deliveryType || 'automatic',
              timestamp: new Date().toISOString(),
              forceReset: true
            }
          }));
          
          // Show comprehensive completion feedback
          toast({
            title: "Message Delivered",
            description: `Your message "${message.title}" has been delivered and the system has been reset.`,
            duration: 8000,
          });
          
        } else {
          // Standard handling for check-in reminders
          console.log(`[MessageCard ${messageId}] Standard delivery completion handling`);
          
          setTimeout(() => {
            setLocalReminderRefreshCounter(prev => prev + 1);
          }, 100);
        }
      }
    };
    
    // Listen for all delivery completion event types
    window.addEventListener('message-delivery-complete', handleDeliveryComplete);
    window.addEventListener('conditions-updated', handleDeliveryComplete);
    window.addEventListener('message-reminder-updated', handleDeliveryComplete);
    
    return () => {
      window.removeEventListener('message-delivery-complete', handleDeliveryComplete);
      window.removeEventListener('conditions-updated', handleDeliveryComplete);
      window.removeEventListener('message-reminder-updated', handleDeliveryComplete);
    };
  }, [messageId, condition?.id, message.title, setLocalReminderRefreshCounter]);
  
  // ENHANCED: Specific reminder update handling
  useEffect(() => {
    const handleReminderUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId: eventMessageId, reminderType, action } = event.detail || {};
      
      // Only update if this event is for this specific message
      if (eventMessageId === messageId) {
        console.log(`[MessageCard ${messageId}] Reminder update event:`, event.detail);
        
        // Priority handling for final delivery reminders
        if (reminderType === 'final_delivery' || action === 'delivery-complete') {
          console.log(`[MessageCard ${messageId}] PRIORITY: Final delivery reminder update`);
          
          // Immediate multiple refreshes for final deliveries
          setLocalReminderRefreshCounter(prev => prev + 1);
          setTimeout(() => setLocalReminderRefreshCounter(prev => prev + 1), 50);
          setTimeout(() => setLocalReminderRefreshCounter(prev => prev + 1), 150);
          
        } else {
          // Standard refresh for regular reminders
          setLocalReminderRefreshCounter(prev => prev + 1);
        }
      }
    };
    
    // Listen for both general and specific events
    window.addEventListener('message-reminder-updated', handleReminderUpdate);
    window.addEventListener('conditions-updated', handleReminderUpdate);
    window.addEventListener('message-targeted-update', handleReminderUpdate);
    
    return () => {
      window.removeEventListener('message-reminder-updated', handleReminderUpdate);
      window.removeEventListener('conditions-updated', handleReminderUpdate);
      window.removeEventListener('message-targeted-update', handleReminderUpdate);
    };
  }, [messageId, setLocalReminderRefreshCounter]);
}
