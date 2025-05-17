
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MessageCondition, Message } from "@/types/message";
import { extractTranscription } from "@/utils/messageFormatUtils";
import { Clock, AlertTriangle, Bell } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { cn } from "@/lib/utils";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription: string | null;
  isPanicTrigger: boolean;
  lastCheckIn: string | null;
  rawCheckInTime: string | null;
  nextReminder: string | null;
  rawNextReminderTime: Date | null;
  deadlineProgress: number;
  timeLeft: string | null;
  upcomingReminders: string[];
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  isPanicTrigger,
  lastCheckIn,
  rawCheckInTime,
  nextReminder,
  rawNextReminderTime,
  deadlineProgress,
  timeLeft,
  upcomingReminders
}: MessageCardContentProps) {
  // Determine if this is a check-in type condition
  const isCheckInCondition = condition?.condition_type === 'no_check_in' || 
                          condition?.condition_type === 'regular_check_in' ||
                          condition?.condition_type === 'inactivity_to_date';
  
  // Extract the content from the message
  const content = message.content || "";
  const messagePreview = message.message_type === 'text' 
    ? content.substring(0, 120) + (content.length > 120 ? '...' : '')
    : transcription 
      ? transcription.substring(0, 100) + (transcription.length > 100 ? '...' : '') 
      : 'No preview available';

  const showDeadline = isArmed && deadline && isCheckInCondition;
  const hasReminders = upcomingReminders && upcomingReminders.length > 0;

  return (
    <div className="space-y-3">
      {/* Message preview text */}
      <p className="text-sm line-clamp-2 leading-relaxed text-gray-600">
        {messagePreview}
      </p>

      {/* Show deadline and countdown if armed */}
      {showDeadline && timeLeft && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" /> 
              Time remaining
            </span>
            <span className={cn(
              "font-mono font-semibold",
              timeLeft === "00:00:00" ? "text-destructive" : 
              deadlineProgress > 75 ? "text-amber-600" : "text-primary"
            )}>
              {timeLeft}
            </span>
          </div>
          <Progress 
            value={100 - deadlineProgress} 
            className={cn(
              "h-1.5 transition-all",
              deadlineProgress > 90 ? "bg-destructive/20" : 
              deadlineProgress > 75 ? "bg-amber-200/50" : "bg-green-200/50"
            )}
            // Update the style approach - use standard className for the indicator
            // instead of the custom indicatorClassName prop that doesn't exist
            style={{
              '--progress-indicator-color': deadlineProgress > 90 ? 'var(--destructive)' : 
                                           deadlineProgress > 75 ? 'rgb(245 158 11)' : 
                                           'rgb(34 197 94)'
            } as React.CSSProperties}
          />
        </div>
      )}

      {/* Panic trigger warning if applicable */}
      {isPanicTrigger && (
        <div className="flex items-center mt-2 text-amber-600 text-xs">
          <AlertTriangle className={`h-3.5 w-3.5 mr-1.5 ${HOVER_TRANSITION}`} />
          <span>Panic trigger message</span>
        </div>
      )}

      {/* Last check-in information if available */}
      {lastCheckIn && condition?.condition_type === 'no_check_in' && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>Last check-in:</span>
          <span>{lastCheckIn}</span>
        </div>
      )}
      
      {/* Next reminder information if available */}
      {nextReminder && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span className="flex items-center">
            <Bell className="h-3 w-3 mr-1" /> 
            Next reminder:
          </span>
          <span>{nextReminder}</span>
        </div>
      )}
      
      {/* Additional reminders indicator */}
      {hasReminders && upcomingReminders.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className="text-[10px] py-0 h-5">
            +{upcomingReminders.length - 1} more reminders
          </Badge>
        </div>
      )}
    </div>
  );
}
