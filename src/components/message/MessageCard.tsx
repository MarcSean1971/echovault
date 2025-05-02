import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MessageSquare, File, Video, Trash2, Edit, ArrowRight, Paperclip, Clock, BellOff, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Message, MessageCondition } from "@/types/message";
import { useState, useEffect } from "react";
import { MessageTimer } from "./MessageTimer";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  getConditionByMessageId, 
  getMessageDeadline, 
  armMessage, 
  disarmMessage 
} from "@/services/messages/conditionService";
import { toast } from "@/components/ui/use-toast";

interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
}

export const getMessageIcon = (type: string) => {
  switch (type) {
    case 'text':
      return <MessageSquare className="h-5 w-5" />;
    case 'voice':
      return <File className="h-5 w-5" />;
    case 'video':
      return <Video className="h-5 w-5" />;
    default:
      return <MessageSquare className="h-5 w-5" />;
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export function MessageCard({ message, onDelete }: MessageCardProps) {
  const navigate = useNavigate();
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  const [isArmed, setIsArmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [condition, setCondition] = useState<MessageCondition | null>(null);
  
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
  
  const handleArmMessage = async () => {
    if (!condition) return;
    
    setIsLoading(true);
    try {
      await armMessage(condition.id);
      setIsArmed(true);
      
      // Get updated deadline
      const deadlineDate = await getMessageDeadline(condition.id);
      setDeadline(deadlineDate);
      
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
      className={`overflow-hidden ${isArmed ? 'border-destructive border-2' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getMessageIcon(message.message_type)}
            <CardTitle className="text-lg">{message.title}</CardTitle>
          </div>
          
          {isArmed && (
            <StatusBadge status="armed" size="sm">
              Armed
            </StatusBadge>
          )}
        </div>
        <CardDescription className="pt-2">
          {formatDate(message.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message.message_type === 'text' ? (
          <p className="line-clamp-3">
            {message.content || "No content"}
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            {message.message_type === 'voice' ? 'Voice message' : 'Video message'}
          </p>
        )}
        
        {hasAttachments && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4 mr-1" />
              <span>{message.attachments!.length} attachment{message.attachments!.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
        
        {condition && (
          <div className="mt-3 pt-3 border-t">
            <MessageTimer deadline={deadline} isArmed={isArmed} />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          {condition ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/message/${message.id}/edit`)}
                disabled={isArmed}
                title={isArmed ? "Disarm message to edit" : "Edit message"}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              
              {isArmed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisarmMessage}
                  disabled={isLoading}
                  className="text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <BellOff className="h-4 w-4 mr-1" /> Disarm
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArmMessage}
                  disabled={isLoading}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Bell className="h-4 w-4 mr-1" /> Arm
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(message.id)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isArmed}
                title={isArmed ? "Disarm message to delete" : "Delete message"}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/message/${message.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(message.id)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/message/${message.id}`)}
        >
          View <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
