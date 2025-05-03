
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get the refresh function from our enhanced hook
  const { refreshConditions, isRefreshing } = useConditionRefresh();
  
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
            // Create a new Date object to ensure reference changes
            setDeadline(deadlineDate ? new Date(deadlineDate.getTime()) : null);
          } else {
            setDeadline(null);
          }
        }
      } catch (error) {
        console.error("Error loading message condition:", error);
      }
    };
    
    loadConditionStatus();
    
    // Also reload when conditions-updated event is received
    const handleConditionsUpdated = () => {
      console.log("MessageCard received conditions-updated event, reloading");
      loadConditionStatus();
      // Force timer components to refresh by updating the trigger
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
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
      // Create a new Date object to ensure reference changes
      setDeadline(deadlineDate ? new Date(deadlineDate.getTime()) : null);
      
      // Force timer components to refresh by updating the trigger
      setRefreshTrigger(prev => prev + 1);
      
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
      
      // Force timer components to refresh by updating the trigger
      setRefreshTrigger(prev => prev + 1);
      
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
          refreshTrigger={refreshTrigger}
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <MessageCardActions
          messageId={message.id}
          condition={condition}
          isArmed={isArmed}
          isLoading={isLoading || isRefreshing}
          onArmMessage={handleArmMessage}
          onDisarmMessage={handleDisarmMessage}
        />
      </CardFooter>
    </Card>
  );
}
