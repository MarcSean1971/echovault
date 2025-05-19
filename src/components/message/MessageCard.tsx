
import React, { memo, useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useMessageCondition, invalidateConditionCache } from "@/hooks/useMessageCondition";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";
import { useMessageLastCheckIn } from "@/hooks/useMessageLastCheckIn";
import { intervalToDuration } from "date-fns";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

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
  // Track local force refresh state
  const [forceRefresh, setForceRefresh] = useState(false);

  // Get condition status and data with potential forced refresh
  const { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    refreshCounter, 
    setRefreshCounter,
    invalidateCache
  } = useMessageCondition(message.id, forceRefresh);
  
  // Reset force refresh after it's been used
  useEffect(() => {
    if (forceRefresh) {
      setForceRefresh(false);
    }
  }, [forceRefresh]);
  
  // Instead of using useMessageTranscription hook here which parses video content,
  // we'll just pass null for video messages in card view to improve performance
  const transcription = message.message_type === 'video' ? null : null;
  
  // Get last check-in information
  const { formattedCheckIn, rawCheckInTime, isDeadmansSwitch } = useMessageLastCheckIn(condition);
  
  // Use reminder info from props (from batched query) instead of individual hook
  const formattedNextReminder = reminderInfo?.formattedNextReminder || null;
  const nextReminder = reminderInfo?.nextReminder || null;
  const upcomingReminders = reminderInfo?.upcomingReminders || [];
  
  // Calculate deadline progress
  const [deadlineProgress, setDeadlineProgress] = useState(0);
  
  // Add state for countdown timer
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // Format time left as HH:MM:SS
  const formatTimeLeft = (targetDate: Date): string => {
    const now = new Date();
    if (now >= targetDate) return "00:00:00";
    
    const duration = intervalToDuration({ start: now, end: targetDate });
    
    // Format with leading zeros
    const hours = String(duration.hours || 0).padStart(2, '0');
    const minutes = String(duration.minutes || 0).padStart(2, '0');
    const seconds = String(duration.seconds || 0).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };
  
  // Update deadline progress and countdown - optimize to update every 5 seconds instead of every second
  useEffect(() => {
    if (isArmed && deadline && condition?.last_checked) {
      const updateProgress = () => {
        const now = new Date();
        const lastCheck = new Date(condition.last_checked);
        const deadlineTime = deadline.getTime();
        const lastCheckTime = lastCheck.getTime();
        const currentTime = now.getTime();
        
        // Calculate what percentage of the time between last check and deadline has passed
        const totalTimeWindow = deadlineTime - lastCheckTime;
        const elapsedTime = currentTime - lastCheckTime;
        
        // Calculate progress (0-100)
        const progress = Math.min(100, Math.max(0, Math.round((elapsedTime / totalTimeWindow) * 100)));
        setDeadlineProgress(progress);
        
        // Update the time left countdown
        setTimeLeft(formatTimeLeft(deadline));
      };
      
      // Initial update
      updateProgress();
      
      // Update progress and countdown timer every 5 seconds for better performance
      const timer = setInterval(updateProgress, 5000);
      return () => clearInterval(timer);
    } else {
      setDeadlineProgress(0);
      setTimeLeft(null);
    }
  }, [isArmed, deadline, condition]);
  
  // Import the action handlers from the hook - now uses the complete implementation
  const { handleArmMessage, handleDisarmMessage, isLoading: actionIsLoading } = useMessageCardActions();
  
  // Action handlers with refresh and cache invalidation
  const onArmMessage = async () => {
    if (!condition) {
      console.log("[MessageCard] Cannot arm message: no condition");
      return;
    }
    
    console.log(`[MessageCard] Fast arming message ${message.id} with condition ${condition.id}`);
    
    // Invalidate cache before arming to ensure fresh data
    invalidateCache();
    
    // Arm the message
    const result = await handleArmMessage(condition.id);
    
    // Force refresh the component after arming
    setForceRefresh(true);
    
    // Increment refresh counter to force timer re-render
    setRefreshCounter(prev => prev + 1);
    
    return result;
  };
  
  const onDisarmMessage = async () => {
    if (!condition) {
      console.log("[MessageCard] Cannot disarm message: no condition");
      return;
    }
    
    console.log(`[MessageCard] Disarming message ${message.id} with condition ${condition.id}`);
    
    // Invalidate cache before disarming to ensure fresh data
    invalidateCache();
    
    // Disarm the message
    await handleDisarmMessage(condition.id);
    
    // Force refresh the component after disarming
    setForceRefresh(true);
    
    // Increment refresh counter to force timer re-render
    setRefreshCounter(prev => prev + 1);
  };

  // Listen for targeted update events
  useEffect(() => {
    const handleTargetedUpdate = (event: Event) => {
      if (event instanceof CustomEvent) {
        const detail = event.detail || {};
        
        // Check if this event targets the current message
        if (detail.messageId === message.id) {
          console.log(`[MessageCard] Received targeted update for message ${message.id}, action: ${detail.action}`);
          
          // Invalidate cache and force refresh
          invalidateCache();
          setForceRefresh(true);
        }
      }
    };
    
    // Listen for targeted update events
    window.addEventListener('message-targeted-update', handleTargetedUpdate);
    
    return () => {
      window.removeEventListener('message-targeted-update', handleTargetedUpdate);
    };
  }, [message.id, invalidateCache]);

  // Listen for reminder generation request events
  useEffect(() => {
    const handleGenerateReminders = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { messageId, conditionId } = event.detail || {};
        
        if (messageId === message.id && conditionId) {
          console.log(`[MessageCard] Background reminder generation for message ${messageId}`);
          // Generate reminders in the background
          ensureReminderSchedule(conditionId, messageId).catch(error => {
            console.error("[MessageCard] Error in background reminder generation:", error);
          });
        }
      }
    };
    
    window.addEventListener('generate-message-reminders', handleGenerateReminders);
    return () => {
      window.removeEventListener('generate-message-reminders', handleGenerateReminders);
    };
  }, [message.id]);

  // Determine card color based on status
  const getCardClasses = () => {
    if (isArmed) {
      return 'border-destructive/50 bg-gradient-to-br from-red-50 to-white';
    } else {
      // Ensure unarmed messages have a green border
      return 'border-green-300 bg-gradient-to-br from-green-50 to-white';
    }
  };

  return (
    <Card 
      key={message.id} 
      className={`overflow-hidden group transition-all duration-300 ${HOVER_TRANSITION} hover:shadow-md ${getCardClasses()}`}
    >
      <CardHeader className={`pb-3 ${isArmed ? 'bg-red-50/20' : 'bg-green-50/20'}`}>
        <MessageCardHeader 
          message={message} 
          isArmed={isArmed} 
          formatDate={formatDate}
          isPanicTrigger={isPanicTrigger}
        />
      </CardHeader>
      <CardContent>
        <MessageCardContent 
          message={message} 
          isArmed={isArmed} 
          deadline={deadline} 
          condition={condition}
          transcription={transcription}
          isPanicTrigger={isPanicTrigger}
          lastCheckIn={formattedCheckIn}
          rawCheckInTime={rawCheckInTime}
          nextReminder={formattedNextReminder}
          rawNextReminderTime={nextReminder}
          deadlineProgress={deadlineProgress}
          timeLeft={timeLeft}
          upcomingReminders={upcomingReminders}
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 bg-gradient-to-t from-muted/20 to-transparent">
        <MessageCardActions
          messageId={message.id}
          condition={condition}
          isArmed={isArmed}
          isLoading={actionIsLoading} 
          onArmMessage={onArmMessage}
          onDisarmMessage={onDisarmMessage}
        />
      </CardFooter>
    </Card>
  );
}

// Memoize the component with a custom comparison function to ensure updates when needed
export const MessageCard = memo(MessageCardInner, (prevProps, nextProps) => {
  // Always re-render if message IDs are different
  if (prevProps.message.id !== nextProps.message.id) return false;
  
  // Check if reminder info has changed
  const prevReminder = prevProps.reminderInfo?.formattedNextReminder;
  const nextReminder = nextProps.reminderInfo?.formattedNextReminder;
  if (prevReminder !== nextReminder) return false;
  
  // Default to standard memo behavior for other properties
  return true;
});
