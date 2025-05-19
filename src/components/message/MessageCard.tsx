
import React, { memo } from "react";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useMessageCard } from "@/hooks/useMessageCard";
import { useMessageLastCheckIn } from "@/hooks/useMessageLastCheckIn";
import { useDeadlineProgress } from "@/hooks/useDeadlineProgress";
import { MessageCardWrapper } from "./card/MessageCardWrapper";

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
  
  // Instead of using useMessageTranscription hook which parses video content,
  // we'll just pass null for video messages in card view to improve performance
  const transcription = message.message_type === 'video' ? null : null;
  
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
    refreshCounter
  );

  return (
    <MessageCardWrapper isArmed={isArmed} messageId={message.id}>
      {{
        header: (
          <MessageCardHeader 
            message={message} 
            isArmed={isArmed} 
            formatDate={formatDate}
            isPanicTrigger={isPanicTrigger}
          />
        ),
        content: (
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
        ),
        footer: (
          <MessageCardActions
            messageId={message.id}
            condition={condition}
            isArmed={isArmed}
            isLoading={actionIsLoading} 
            onArmMessage={onArmMessage}
            onDisarmMessage={onDisarmMessage}
          />
        )
      }}
    </MessageCardWrapper>
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
