
import React, { memo, useMemo, useEffect, useState } from "react";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useMessageCard } from "@/hooks/useMessageCard";
import { useMessageLastCheckIn } from "@/hooks/useMessageLastCheckIn";
import { useDeadlineProgress } from "@/hooks/useDeadlineProgress";
import { MessageCardWrapper } from "./card/MessageCardWrapper";
import { triggerDeadmanSwitch } from "@/services/messages/whatsApp";
import { toast } from "@/hooks/use-toast";

interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
  reminderInfo?: {
    messageId: string;
    nextReminder: Date | null;
    formattedNextReminder: string | null;
    hasSchedule: boolean;
    upcomingReminders: string[];
  };
}

// The non-memoized inner component
function MessageCardInner({ message, onDelete, reminderInfo }: MessageCardProps) {
  // Local state to track reminder updates
  const [localReminderRefreshCounter, setLocalReminderRefreshCounter] = useState(0);
  
  // Get condition, state and actions from our custom hook
  const { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    refreshCounter,
    actionIsLoading,
    onArmMessage, 
    onDisarmMessage
  } = useMessageCard(message.id);
  
  // Get last check-in information
  const { formattedCheckIn, rawCheckInTime, isDeadmansSwitch } = useMessageLastCheckIn(condition);
  
  // Use reminder info from props (from batched query) instead of individual hook
  const formattedNextReminder = reminderInfo?.formattedNextReminder || null;
  const nextReminder = reminderInfo?.nextReminder || null;
  const upcomingReminders = reminderInfo?.upcomingReminders || [];
  
  // Get deadline progress and countdown
  const { deadlineProgress, timeLeft } = useDeadlineProgress(
    isArmed, 
    deadline, 
    condition, 
    refreshCounter + localReminderRefreshCounter // Add local counter to force refresh
  );
  
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
  }, [message.id, isArmed, deadline, condition, message.title, isDeadmansSwitch]);
  
  // Listen for specific reminder updates for this card
  useEffect(() => {
    const handleReminderUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId } = event.detail || {};
      
      // Only update if this event is for this specific message
      if (messageId === message.id) {
        console.log(`[MessageCard ${message.id}] Received reminder update event, refreshing`);
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
  }, [message.id]);

  // Memoize header, content and footer to reduce re-renders
  const header = useMemo(() => (
    <MessageCardHeader 
      message={message} 
      isArmed={isArmed} 
      formatDate={formatDate}
      isPanicTrigger={isPanicTrigger}
      condition={condition}
    />
  ), [message, isArmed, isPanicTrigger, condition]);
  
  const content = useMemo(() => (
    <MessageCardContent 
      message={message} 
      isArmed={isArmed} 
      deadline={deadline} 
      condition={condition}
      transcription={null}
      isPanicTrigger={isPanicTrigger}
      lastCheckIn={formattedCheckIn}
      rawCheckInTime={rawCheckInTime}
      nextReminder={formattedNextReminder}
      rawNextReminderTime={nextReminder}
      deadlineProgress={deadlineProgress}
      timeLeft={timeLeft}
      upcomingReminders={upcomingReminders}
    />
  ), [
    message,
    isArmed,
    deadline,
    condition,
    isPanicTrigger,
    formattedCheckIn,
    rawCheckInTime,
    formattedNextReminder,
    nextReminder,
    deadlineProgress,
    timeLeft,
    upcomingReminders
  ]);
  
  const footer = useMemo(() => (
    <MessageCardActions
      messageId={message.id}
      condition={condition}
      isArmed={isArmed}
      isLoading={actionIsLoading} 
      onArmMessage={onArmMessage}
      onDisarmMessage={onDisarmMessage}
    />
  ), [message.id, condition, isArmed, actionIsLoading, onArmMessage, onDisarmMessage]);

  return (
    <MessageCardWrapper isArmed={isArmed} messageId={message.id}>
      {{
        header,
        content,
        footer
      }}
    </MessageCardWrapper>
  );
}

// FIXED: Much less restrictive memo function that prioritizes check-in data updates
export const MessageCard = memo(MessageCardInner, (prevProps, nextProps) => {
  // Always re-render if message IDs are different
  if (prevProps.message.id !== nextProps.message.id) return false;
  
  // Always re-render if message content has changed
  if (prevProps.message.updated_at !== nextProps.message.updated_at) return false;
  
  // Check if reminder info has changed substantially
  const prevReminder = prevProps.reminderInfo?.formattedNextReminder;
  const nextReminder = nextProps.reminderInfo?.formattedNextReminder;
  
  // Re-render if reminders have changed
  if (prevReminder !== nextReminder) return false;
  
  // Check if reminder count has changed
  if ((prevProps.reminderInfo?.upcomingReminders?.length || 0) !== 
      (nextProps.reminderInfo?.upcomingReminders?.length || 0)) return false;

  // CRITICAL FIX: Always re-render to ensure check-in updates are shown
  // The component will handle its own optimization through internal memoization
  // This ensures that when WhatsApp check-ins occur, the UI updates immediately
  return false; // Always allow re-render for immediate check-in updates
});
