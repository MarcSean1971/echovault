
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Message, MessageCondition } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { 
  getConditionByMessageId, 
  getMessageDeadline, 
  armMessage, 
  disarmMessage 
} from "@/services/messages/conditionService";
import { formatDate } from "@/utils/messageFormatUtils";
import { MessageCardHeader } from "./card/MessageCardHeader";
import { MessageCardContent } from "./card/MessageCardContent";
import { MessageCardActions } from "./card/MessageCardActions";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
}

export function MessageCard({ message, onDelete }: MessageCardProps) {
  const [isArmed, setIsArmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [condition, setCondition] = useState<MessageCondition | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  // Add panic sending states
  const [isPanicSending, setIsPanicSending] = useState(false);
  const [panicCountDown, setPanicCountDown] = useState(0);
  
  // Get the refresh function from our enhanced hook
  const { refreshConditions, isRefreshing } = useConditionRefresh();
  
  // Load message condition status
  useEffect(() => {
    const loadConditionStatus = async () => {
      try {
        console.log(`[MessageCard] Loading condition for message ID: ${message.id}`);
        const messageCondition = await getConditionByMessageId(message.id);
        
        if (messageCondition) {
          console.log(`[MessageCard] Got condition ID: ${messageCondition.id}, active: ${messageCondition.active}`);
          setCondition(messageCondition);
          setIsArmed(messageCondition.active);
          
          // Get deadline if message is armed
          if (messageCondition.active) {
            const deadlineDate = await getMessageDeadline(messageCondition.id);
            // Create a new Date object to ensure React detects the change
            if (deadlineDate) {
              console.log(`[MessageCard] Got deadline: ${deadlineDate.toISOString()}`);
              setDeadline(new Date(deadlineDate.getTime()));
            } else {
              setDeadline(null);
            }
          }
        }
      } catch (error) {
        console.error("Error loading message condition:", error);
      }
    };
    
    loadConditionStatus();
    
    // Also reload when conditions-updated event is received
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log(`[MessageCard ${message.id}] Received conditions-updated event, reloading with trigger: ${event.detail?.triggerValue || 'unknown'}`);
        loadConditionStatus();
        // Increment refresh counter to force re-render of timer
        setRefreshCounter(prev => prev + 1);
        
        // Check if this is a panic trigger event
        if (event.detail?.panicMessageId === message.id) {
          console.log(`[MessageCard ${message.id}] This is the panic message being triggered!`);
          handlePanicSendingState();
        } else if (event.detail?.panicTrigger && isPanicSending) {
          // Reset panic state if another panic was triggered and this one was already in sending state
          setIsPanicSending(false);
          setPanicCountDown(0);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [message.id]);
  
  // Handle panic sending state with countdown
  const handlePanicSendingState = () => {
    setIsPanicSending(true);
    let count = 3;
    setPanicCountDown(count);
    
    const interval = setInterval(() => {
      count -= 1;
      setPanicCountDown(count);
      
      if (count <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          setIsPanicSending(false);
        }, 1000); // Keep "SENDING..." displayed for 1 more second after countdown
      }
    }, 1000);
  };
  
  // Try to extract transcription from content for voice/video messages
  useEffect(() => {
    if (message.message_type !== 'text' && message.content) {
      try {
        const contentObj = JSON.parse(message.content);
        if (contentObj.transcription) {
          setTranscription(contentObj.transcription);
        }
      } catch (e) {
        // Not JSON or no transcription field, use content as is
        setTranscription(message.content);
      }
    }
  }, [message]);
  
  const handleArmMessage = async () => {
    if (!condition) return;
    
    setIsLoading(true);
    try {
      await armMessage(condition.id);
      setIsArmed(true);
      
      // Get updated deadline
      const deadlineDate = await getMessageDeadline(condition.id);
      // Create a new Date object to ensure React detects the change
      setDeadline(deadlineDate ? new Date(deadlineDate.getTime()) : null);
      
      // Refresh condition data in other components
      await refreshConditions();
      
      // Increment refresh counter to force timer re-render
      setRefreshCounter(prev => prev + 1);
      
      toast({
        title: "Message armed",
        description: "Your message has been armed and will trigger according to your settings",
      });
    } catch (error) {
      console.error("Error arming message:", error);
      toast({
        title: "Failed to arm message",
        description: "There was a problem arming your message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisarmMessage = async () => {
    if (!condition) return;
    
    setIsLoading(true);
    try {
      await disarmMessage(condition.id);
      setIsArmed(false);
      setDeadline(null);
      
      // Refresh condition data in other components
      await refreshConditions();
      
      // Increment refresh counter to force timer re-render
      setRefreshCounter(prev => prev + 1);
      
      toast({
        title: "Message disarmed",
        description: "Your message has been disarmed and will not trigger",
      });
    } catch (error) {
      console.error("Error disarming message:", error);
      toast({
        title: "Failed to disarm message",
        description: "There was a problem disarming your message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log(`[MessageCard ${message.id}] Rendering with refreshCounter: ${refreshCounter}, deadline: ${deadline?.toISOString() || 'null'}, isArmed: ${isArmed}`);

  // Check if this is a panic trigger message
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';

  return (
    <Card 
      key={message.id} 
      className={`overflow-hidden ${isPanicSending ? 'border-red-500 border-2 animate-pulse' : isArmed ? 'border-destructive border-2' : 'border-green-500 border-2'}`}
    >
      <CardHeader className="pb-3">
        <MessageCardHeader 
          message={message} 
          isArmed={isArmed} 
          formatDate={formatDate}
          isPanicTrigger={isPanicTrigger}
        />
        <CardDescription className="pt-2 ml-7">
          {formatDate(message.created_at)}
        </CardDescription>
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
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <MessageCardActions
          messageId={message.id}
          condition={condition}
          isArmed={isArmed}
          isLoading={isLoading || isRefreshing || isPanicSending}
          onArmMessage={handleArmMessage}
          onDisarmMessage={handleDisarmMessage}
        />
      </CardFooter>
    </Card>
  );
}
