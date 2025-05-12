
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Message } from "@/types/message";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useMessageCondition } from "@/hooks/useMessageCondition";
import { useMessageTranscription } from "@/hooks/useMessageTranscription";
import { usePanicSendingState } from "@/hooks/usePanicSendingState";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";
import { useMessageDeliveryStatus } from "@/hooks/useMessageDeliveryStatus";

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
    refreshCounter, 
    setRefreshCounter 
  } = useMessageCondition(message.id);
  
  // Get panic sending state
  const { isPanicSending, panicCountDown } = usePanicSendingState(message.id);
  
  // Get transcription if available
  const { transcription } = useMessageTranscription(message);
  
  // Get message delivery status
  const { isDelivered } = useMessageDeliveryStatus(message.id);
  
  // Get message actions
  const { isLoading, handleArmMessage, handleDisarmMessage } = useMessageCardActions();
  
  // Get the refresh function from our enhanced hook
  const { isRefreshing } = useConditionRefresh();

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

  // Check if this is a panic trigger message
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';

  // Determine card color based on status
  const getCardClasses = () => {
    if (isPanicSending) {
      return 'border-red-500 shadow-red-100 border-2 animate-pulse bg-gradient-to-br from-red-50 to-white';
    } else if (isDelivered) {
      return 'border-blue-300 bg-gradient-to-br from-blue-50 to-white';
    } else if (isArmed) {
      return 'border-destructive/50 bg-gradient-to-br from-red-50 to-white';
    } else {
      return 'border-green-300 bg-gradient-to-br from-green-50 to-white';
    }
  };

  return (
    <Card 
      key={message.id} 
      className={`overflow-hidden group transition-all duration-300 hover:shadow-md ${getCardClasses()}`}
    >
      <CardHeader className={`pb-3 ${
        isPanicSending ? 'bg-red-50/50' : 
        isDelivered ? 'bg-blue-50/20' :
        isArmed ? 'bg-red-50/20' : 
        'bg-green-50/20'
      }`}>
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
          refreshTrigger={refreshCounter}
          isPanicSending={isPanicSending}
          panicCountDown={panicCountDown}
          isDelivered={isDelivered}
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 bg-gradient-to-t from-muted/20 to-transparent">
        <MessageCardActions
          messageId={message.id}
          condition={condition}
          isArmed={isArmed}
          isLoading={isLoading || isRefreshing || isPanicSending}
          onArmMessage={onArmMessage}
          onDisarmMessage={onDisarmMessage}
        />
      </CardFooter>
    </Card>
  );
}
