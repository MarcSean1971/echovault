
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MessageCondition, Message } from "@/types/message";
import { Clock, Bell, Video } from "lucide-react";
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
  
  // Extract the preview content from the message with improved handling for all message types
  const isVideoMessage = message.message_type === 'video';
  
  // For all message types, use text_content or content when available
  const messagePreview = (message.text_content || message.content || '').substring(0, 120) + 
      ((message.text_content || message.content || '').length > 120 ? '...' : '');

  const showDeadline = isArmed && deadline && isCheckInCondition;
  const hasReminders = upcomingReminders && upcomingReminders.length > 0;

  return (
    <div className="space-y-3">
      {/* Message preview text - now with consistent height of minimum 2 lines */}
      <div className="text-sm leading-relaxed text-gray-600">
        <p className="line-clamp-2 min-h-[2.5rem]">
          {messagePreview || "\u00A0"}
        </p>
      </div>

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
            indicatorClassName={cn(
              deadlineProgress > 90 ? "bg-destructive" : 
              deadlineProgress > 75 ? "bg-amber-500" : 
              "bg-green-500"
            )}
          />
        </div>
      )}

      {/* Panic trigger warning section - completely removed icon */}
      {isPanicTrigger && (
        <div className="flex items-center mt-2 text-amber-600 text-xs">
          {/* AlertTriangle icon removed */}
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
