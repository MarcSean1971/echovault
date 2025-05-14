
import React from "react";
import { MessageCondition, Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Clock, Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatShortDate } from "@/utils/messageFormatUtils";
import { MessageTimer } from "@/components/message/MessageTimer";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription?: string | null;
  isPanicTrigger?: boolean;
  lastCheckIn?: string | null;
  rawCheckInTime?: string | null; // Added raw timestamp for precise formatting
  nextReminder?: string | null;
  rawNextReminderTime?: Date | null; // Added raw Date object for precise formatting
  deadlineProgress?: number;
  timeLeft?: string | null; // Added formatted time left string (HH:MM:SS)
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  isPanicTrigger = false,
  lastCheckIn = null,
  rawCheckInTime = null,
  nextReminder = null,
  rawNextReminderTime = null,
  deadlineProgress = 0,
  timeLeft = null
}: MessageCardContentProps) {
  // Get the content to display (use transcription if available for video content)
  const displayContent = 
    message.message_type === 'video' && transcription ? 
    transcription : 
    (message.text_content || message.content);
  
  // Check if we have check-in or reminder data to show
  const hasCheckInData = rawCheckInTime !== null;
  const hasReminderData = rawNextReminderTime !== null || nextReminder !== null;
  
  // Format check-in and reminder times using the precise format
  const formattedCheckInTime = rawCheckInTime ? formatShortDate(rawCheckInTime) : null;
  const formattedNextReminderTime = rawNextReminderTime ? formatShortDate(rawNextReminderTime.toISOString()) : null;
  
  return (
    <div className="flex flex-col h-full">
      {/* Message content excerpt */}
      <div className="mb-3">
        <div className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
          {displayContent || "No content available"}
        </div>
      </div>
      
      {/* Check-in, Reminder info and Countdown timer section */}
      <div className="mt-auto pt-2 border-t border-muted/40">
        {/* Last check-in time - showing whenever available */}
        {formattedCheckInTime && (
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <Clock className={`h-3.5 w-3.5 mr-1.5 ${HOVER_TRANSITION}`} />
            <span>Last check-in: {formattedCheckInTime}</span>
          </div>
        )}
        
        {/* Next reminder time - showing whenever available */}
        {formattedNextReminderTime && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Bell className={`h-3.5 w-3.5 mr-1.5 ${HOVER_TRANSITION}`} />
            <span>Next reminder: {formattedNextReminderTime}</span>
          </div>
        )}
        
        {/* Countdown display - using MessageTimer component for consistency */}
        {isArmed && deadline && (
          <div className="w-full mt-2 scale-90 origin-top-left">
            <MessageTimer 
              deadline={deadline} 
              isArmed={isArmed} 
              refreshTrigger={deadlineProgress} // Using deadlineProgress as a refresh trigger
            />
          </div>
        )}
      </div>
    </div>
  );
}
