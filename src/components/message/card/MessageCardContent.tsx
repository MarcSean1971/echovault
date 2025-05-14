
import React from "react";
import { MessageCondition, Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Clock, Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription?: string | null;
  isPanicTrigger?: boolean;
  lastCheckIn?: string | null;
  nextReminder?: string | null;
  deadlineProgress?: number;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  isPanicTrigger = false,
  lastCheckIn = null,
  nextReminder = null,
  deadlineProgress = 0
}: MessageCardContentProps) {
  // Get the content to display (use transcription if available for video content)
  const displayContent = 
    message.message_type === 'video' && transcription ? 
    transcription : 
    (message.text_content || message.content);
  
  // Only show check-in and reminder info for deadman's switch messages
  const showDeadmanInfo = isArmed && condition && 
    (condition.condition_type === 'no_check_in' || 
     condition.condition_type === 'regular_check_in');
  
  return (
    <div className="flex flex-col h-full">
      {/* Message content excerpt */}
      <div className="mb-3">
        <div className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
          {displayContent || "No content available"}
        </div>
      </div>
      
      {/* Deadman's switch info section */}
      {showDeadmanInfo && (
        <div className="mt-auto pt-2 border-t border-muted/40">
          {/* Last check-in time */}
          {lastCheckIn && (
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Clock className={`h-3.5 w-3.5 mr-1.5 ${HOVER_TRANSITION}`} />
              <span>Last check-in: {lastCheckIn}</span>
            </div>
          )}
          
          {/* Next reminder time */}
          {nextReminder && (
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <Bell className={`h-3.5 w-3.5 mr-1.5 ${HOVER_TRANSITION}`} />
              <span>Next reminder: {nextReminder}</span>
            </div>
          )}
          
          {/* Countdown progress bar */}
          {isArmed && deadline && (
            <div className="w-full mt-1">
              <Progress 
                value={deadlineProgress} 
                className={`h-1.5 ${
                  deadlineProgress > 75 ? 'bg-red-200' : 
                  deadlineProgress > 50 ? 'bg-amber-200' : 
                  'bg-muted'
                }`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
