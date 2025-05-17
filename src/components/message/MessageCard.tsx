
import React, { memo, useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useMessageCondition } from "@/hooks/useMessageCondition";
import { useMessageTranscription } from "@/hooks/useMessageTranscription";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";
import { useMessageLastCheckIn } from "@/hooks/useMessageLastCheckIn";
import { intervalToDuration } from "date-fns";

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
  // Get condition status and data
  const { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    refreshCounter, 
    setRefreshCounter 
  } = useMessageCondition(message.id);
  
  // Get transcription if available (with lazy loading)
  const { transcription } = useMessageTranscription(message);
  
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
  
  // Import the action handlers from the hook
  const { handleArmMessage, handleDisarmMessage } = useMessageCardActions();
  
  // Action handlers with refresh counter update
  const onArmMessage = async () => {
    if (!condition) return;
    
    await handleArmMessage(condition.id);
    // Increment refresh counter to force timer re-render
    setRefreshCounter(prev => prev + 1);
  };
  
  const onDisarmMessage = async () => {
    if (!condition) return;
    
    await handleDisarmMessage(condition.id);
    // Increment refresh counter to force timer re-render
    setRefreshCounter(prev => prev + 1);
  };

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
          rawNextReminderTime={nextReminder} // This is now correctly typed as Date | null
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
          isLoading={false}
          onArmMessage={onArmMessage}
          onDisarmMessage={onDisarmMessage}
        />
      </CardFooter>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const MessageCard = memo(MessageCardInner);
