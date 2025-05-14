
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useMessageCondition } from "@/hooks/useMessageCondition";
import { useMessageTranscription } from "@/hooks/useMessageTranscription";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
