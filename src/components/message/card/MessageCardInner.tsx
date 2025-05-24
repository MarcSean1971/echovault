
import React, { useState, useMemo } from "react";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./MessageCardHeader";
import { MessageCardContent } from "./MessageCardContent";
import { MessageCardActions } from "./MessageCardActions";
import { MessageCardWrapper } from "./MessageCardWrapper";
import { useMessageCardState } from "./hooks/useMessageCardState";
import { useMessageCardEvents } from "./hooks/useMessageCardEvents";

interface MessageCardInnerProps {
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

export function MessageCardInner({ message, onDelete, reminderInfo }: MessageCardInnerProps) {
  // Local state to track reminder updates
  const [localReminderRefreshCounter, setLocalReminderRefreshCounter] = useState(0);
  
  // Get all message card state
  const {
    isArmed,
    deadline,
    condition,
    isPanicTrigger,
    refreshCounter,
    actionIsLoading,
    onArmMessage,
    onDisarmMessage,
    formattedCheckIn,
    rawCheckInTime,
    isDeadmansSwitch,
    deadlineProgress,
    timeLeft
  } = useMessageCardState(message.id, localReminderRefreshCounter);
  
  // Handle events
  useMessageCardEvents({
    messageId: message.id,
    message,
    isArmed,
    deadline,
    condition,
    isDeadmansSwitch,
    setLocalReminderRefreshCounter
  });
  
  // Use reminder info from props (from batched query) instead of individual hook
  const formattedNextReminder = reminderInfo?.formattedNextReminder || null;
  const nextReminder = reminderInfo?.nextReminder || null;
  const upcomingReminders = reminderInfo?.upcomingReminders || [];
  
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
