
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
  
  // Get the refresh function from our new hook
  const { refreshConditions } = useConditionRefresh();
  
  // Load message condition status
  useEffect(() => {
    const loadConditionStatus = async () => {
      try {
        const messageCondition = await getConditionByMessageId(message.id);
        
        if (messageCondition) {
          setCondition(messageCondition);
          setIsArmed(messageCondition.active);
          
          // Get deadline if message is armed
          if (messageCondition.active) {
            const deadlineDate = await getMessageDeadline(messageCondition.id);
            setDeadline(deadlineDate);
          }
        }
      } catch (error) {
        console.error("Error loading message condition:", error);
      }
    };
    
    loadConditionStatus();
  }, [message.id]);
  
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
      setDeadline(deadlineDate);
      
      // Refresh condition data in other components
      await refreshConditions();
      
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

  return (
    <Card 
      key={message.id} 
      className={`overflow-hidden ${isArmed ? 'border-destructive border-2' : 'border-green-500 border-2'}`}
    >
      <CardHeader className="pb-3">
        <MessageCardHeader 
          message={message} 
          isArmed={isArmed} 
          formatDate={formatDate} 
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
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <MessageCardActions
          messageId={message.id}
          condition={condition}
          isArmed={isArmed}
          isLoading={isLoading}
          onArmMessage={handleArmMessage}
          onDisarmMessage={handleDisarmMessage}
        />
      </CardFooter>
    </Card>
  );
}
