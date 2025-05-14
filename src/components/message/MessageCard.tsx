
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
import { useScheduledReminders } from "@/hooks/useScheduledReminders";
import { useEffect, useState } from "react";

interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
}

export function MessageCard({ message, onDelete }: MessageCardProps) {
  // Get condition status and data
  const { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    refreshCounter, 
    setRefreshCounter 
  } = useMessageCondition(message.id);
  
  // Get transcription if available
  const { transcription } = useMessageTranscription(message);
  
  // Get last check-in information
  const { formattedCheckIn, isDeadmansSwitch } = useMessageLastCheckIn(condition);
  
  // Get next scheduled reminder
  const { formattedNextReminder } = useScheduledReminders(message.id, refreshCounter);
  
  // Calculate deadline progress
  const [deadlineProgress, setDeadlineProgress] = useState(0);
  
  // Update deadline progress
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
      };
      
      // Initial update
      updateProgress();
      
      // Update progress every minute
      const timer = setInterval(updateProgress, 60000);
      return () => clearInterval(timer);
    } else {
      setDeadlineProgress(0);
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
          nextReminder={formattedNextReminder}
          deadlineProgress={deadlineProgress}
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
