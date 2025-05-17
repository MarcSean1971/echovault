
import React from "react";
import { Message, MessageCondition } from "@/types/message";
import { Clock, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  isPanicTrigger: boolean;
  condition: MessageCondition | null;
  deadline: Date | null;
  transcription: string | null;
  lastCheckIn: string | null;
  rawCheckInTime: Date | null;
  nextReminder: string | null;
  rawNextReminderTime: Date | null;
  deadlineProgress: number;
  timeLeft: string | null;
  upcomingReminders?: string[];
}

export function MessageCardContent({
  message,
  isArmed,
  isPanicTrigger,
  condition,
  deadline,
  transcription,
  lastCheckIn,
  rawCheckInTime,
  nextReminder,
  rawNextReminderTime,
  deadlineProgress,
  timeLeft,
  upcomingReminders = []
}: MessageCardContentProps) {
  // Display a snippet of the content
  const getContentSnippet = () => {
    if (message.message_type === 'video') {
      if (transcription) {
        return `${transcription.substring(0, 100)}${transcription.length > 100 ? '...' : ''}`;
      } else {
        try {
          const videoData = JSON.parse(message.content || '{}');
          if (videoData?.additionalText) {
            return `${videoData.additionalText.substring(0, 100)}${videoData.additionalText.length > 100 ? '...' : ''}`;
          }
        } catch (e) {
          // Not JSON
        }
        return 'Video message';
      }
    }
    
    // Default to text content
    const displayContent = message.text_content || message.content;
    if (!displayContent) return 'No content';
    return `${displayContent.substring(0, 100)}${displayContent.length > 100 ? '...' : ''}`;
  };
  
  // Get status badge
  const getStatusBadge = () => {
    if (!condition) return null;
    
    if (isPanicTrigger) {
      return (
        <Badge 
          variant="outline" 
          className="bg-red-50 text-red-600 border-red-200 hover:border-red-300 mt-2"
        >
          {isArmed ? 'Emergency Ready' : 'Emergency Standby'}
        </Badge>
      );
    }
    
    if (isArmed) {
      return (
        <Badge 
          variant="outline" 
          className="bg-red-50 text-red-600 border-red-200 hover:border-red-300 mt-2"
        >
          Armed
        </Badge>
      );
    }
    
    return (
      <Badge 
        variant="outline" 
        className="bg-green-50 text-green-600 border-green-200 hover:border-green-300 mt-2"
      >
        Disarmed
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {/* Content Preview */}
      <p className="text-sm text-gray-600 line-clamp-2">
        {getContentSnippet()}
      </p>
      
      {/* Status Badge */}
      <div className="flex flex-wrap gap-2 items-center">
        {getStatusBadge()}
        
        {message.attachments && message.attachments.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 mt-2">
            {message.attachments.length} {message.attachments.length === 1 ? 'Attachment' : 'Attachments'}
          </Badge>
        )}
      </div>
      
      {/* Progress Bar - Only for armed deadman's switch */}
      {isArmed && !isPanicTrigger && deadline && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
              <span>{lastCheckIn || 'Never'}</span>
            </div>
            <span>{timeLeft}</span>
          </div>
          <Progress 
            value={deadlineProgress} 
            className={`h-2 ${deadlineProgress > 75 ? 'bg-red-200' : 'bg-muted'}`}
            indicatorClassName={deadlineProgress > 75 ? 'bg-red-500' : 'bg-blue-500'}
          />
        </div>
      )}
      
      {/* Next reminder - Only show if we have reminder data */}
      {nextReminder && (
        <div className="text-xs text-muted-foreground flex items-center mt-2">
          <AlertTriangle className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} />
          Next reminder: {nextReminder}
        </div>
      )}
      
      {/* Show up to 1 upcoming reminder if we have them */}
      {!nextReminder && upcomingReminders && upcomingReminders.length > 0 && (
        <div className="text-xs text-muted-foreground flex items-center mt-2">
          <Clock className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} />
          Next: {upcomingReminders[0]}
        </div>
      )}
    </div>
  );
}
