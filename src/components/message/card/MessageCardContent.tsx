
import React from "react";
import { Clock, MailCheck, AlertTriangle, CheckCircle, BellRing } from "lucide-react";
import { MessageCondition, Message } from "@/types/message";
import { useNextReminders } from "@/hooks/useNextReminders";
import { parseReminderMinutes } from "@/utils/reminderUtils";
import { useScheduledReminders } from "@/hooks/useScheduledReminders";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription?: string | null;
  refreshTrigger?: number;
  isPanicSending?: boolean;
  panicCountDown?: number | null;
  isDelivered?: boolean;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  refreshTrigger = 0,
  isPanicSending = false,
  panicCountDown = null,
  isDelivered = false
}: MessageCardContentProps) {
  // Get reminder information
  const reminderMinutes = condition ? parseReminderMinutes(condition?.reminder_hours) : [];
  const { nextReminder } = useNextReminders(deadline, reminderMinutes, refreshTrigger);
  
  // Get scheduled reminder information
  const scheduledReminders = useScheduledReminders(message.id, refreshTrigger);
  
  // Determine if this is a panic trigger or check-in type
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';
  const isCheckIn = ['no_check_in', 'recurring_check_in'].includes(condition?.condition_type || '');
  
  // Get the content to display (use transcription if available for video content)
  const displayContent = 
    message.message_type === 'video' && transcription ? 
    transcription : 
    (message.text_content || message.content);
  
  // Display emergency content
  const isPanicEmergency = isPanicSending || (isPanicTrigger && isArmed);
  
  return (
    <div>
      <h3 className="text-lg font-semibold">
        {message.title}
      </h3>
      
      {/* Summary of the message content */}
      <div className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-2">
        {displayContent || "No content available"}
      </div>
      
      {/* Status and time indicators */}
      <div className="flex flex-wrap gap-3 mt-3">
        {/* Armed status indicator */}
        {isArmed ? (
          <div className="flex items-center space-x-1.5 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            <AlertTriangle className={`h-3 w-3 ${ICON_HOVER_EFFECTS.destructive}`} />
            <span>Armed</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            <CheckCircle className={`h-3 w-3 ${ICON_HOVER_EFFECTS.success}`} />
            <span>Disarmed</span>
          </div>
        )}
        
        {/* Panic emergency / regular timer */}
        {isPanicEmergency ? (
          // Show panic countdown if available
          <div className="flex items-center space-x-1.5 text-xs bg-red-100 text-red-700 px-2 py-1 rounded animate-pulse">
            <AlertTriangle className={`h-3 w-3 ${ICON_HOVER_EFFECTS.destructive}`} />
            {panicCountDown !== null ? (
              <span>Sending in {panicCountDown}s</span>
            ) : (
              <span>Emergency Active</span>
            )}
          </div>
        ) : isDelivered ? (
          // Show delivered status
          <div className="flex items-center space-x-1.5 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            <MailCheck className={`h-3 w-3 ${ICON_HOVER_EFFECTS.info}`} />
            <span>Delivered</span>
          </div>
        ) : (
          // Show deadline if available
          deadline && isArmed && (
            <div className="flex items-center space-x-1.5 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
              <Clock className={`h-3 w-3 ${ICON_HOVER_EFFECTS.warning}`} />
              <span>
                {isCheckIn ? "Check-in Deadline" : "Delivery"}: {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        )}
      </div>
      
      {/* Next reminder and last reminder information */}
      <div className="flex flex-col gap-1 mt-3 text-xs text-muted-foreground">
        {/* Show next reminder time if available */}
        {isArmed && scheduledReminders.nextReminder && (
          <div className="flex items-center space-x-1.5">
            <BellRing className={`h-3 w-3 ${ICON_HOVER_EFFECTS.muted}`} />
            <span>
              Next reminder: {scheduledReminders.formattedNextReminder}
            </span>
          </div>
        )}
        
        {/* Show last reminder sent */}
        {scheduledReminders.lastReminder.sentAt && (
          <div className="flex items-center space-x-1.5">
            <Clock className={`h-3 w-3 ${ICON_HOVER_EFFECTS.muted}`} />
            <span>
              {isDelivered ? "Alert sent:" : "Reminder sent:"} {scheduledReminders.lastReminder.formattedSentAt}
              {scheduledReminders.lastReminder.scheduledFor && 
                ` (scheduled for ${scheduledReminders.lastReminder.formattedScheduledFor})`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
