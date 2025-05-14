
import React from "react";
import { MessageCondition, Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Clock, CheckCircle, AlertTriangle, BellRing } from "lucide-react";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription?: string | null;
  isPanicTrigger?: boolean;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  isPanicTrigger = false
}: MessageCardContentProps) {
  // Get the content to display (use transcription if available for video content)
  const displayContent = 
    message.message_type === 'video' && transcription ? 
    transcription : 
    (message.text_content || message.content);
  
  return (
    <div className="flex flex-col h-full">
      {/* Message content excerpt */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
          {displayContent || "No content available"}
        </div>
      </div>
      
      {/* Status indicators */}
      <div className="mt-auto flex flex-wrap gap-2 text-xs">
        {isArmed ? (
          <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-1 rounded-full">
            <AlertTriangle className={`h-3 w-3 ${HOVER_TRANSITION}`} />
            <span>Armed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-full">
            <CheckCircle className={`h-3 w-3 ${HOVER_TRANSITION}`} />
            <span>Safe</span>
          </div>
        )}
        
        {/* Only show deadline if message is armed */}
        {deadline && isArmed && (
          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            <Clock className={`h-3 w-3 ${HOVER_TRANSITION}`} />
            <span>
              {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        {/* Show panic trigger indicator */}
        {isPanicTrigger && (
          <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-1 rounded-full">
            <AlertTriangle className={`h-3 w-3 ${HOVER_TRANSITION}`} />
            <span>Panic Trigger</span>
          </div>
        )}
      </div>
    </div>
  );
}
