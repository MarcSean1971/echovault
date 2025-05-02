import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { 
  getConditionByMessageId,
  getMessageDeadline,
  armMessage,
  disarmMessage
} from "@/services/messages/conditionService";
import { MessageLoading } from "@/components/message/detail/MessageLoading";
import { MessageNotFound } from "@/components/message/detail/MessageNotFound";
import { MessageDetailContent } from "@/components/message/detail/MessageDetailContent";
import { formatDate, getConditionType, renderRecipientsList } from "@/utils/messageHelpers";
import { Message } from "@/types/message";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [condition, setCondition] = useState<any | null>(null);

  useEffect(() => {
    if (!userId || !id) return;
    
    const fetchMessage = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        setMessage(data as Message);
        
        // Check if message has a condition and if it's armed
        const conditionData = await getConditionByMessageId(id);
        if (conditionData) {
          setCondition(conditionData);
          setIsArmed(conditionData.active);
          setConditionId(conditionData.id);
          
          if (conditionData.active) {
            const deadlineDate = await getMessageDeadline(conditionData.id);
            setDeadline(deadlineDate);
          }
        }
      } catch (error: any) {
        console.error("Error fetching message:", error);
        toast({
          title: "Error",
          description: "Failed to load the message",
          variant: "destructive"
        });
        navigate("/messages");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessage();
  }, [userId, id, navigate]);
  
  const handleDelete = async () => {
    if (!message) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);
        
      if (error) throw error;
      
      toast({
        title: "Message deleted",
        description: "Your message has been permanently deleted",
      });
      
      navigate("/messages");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete the message",
        variant: "destructive"
      });
    }
  };
  
  const handleArmMessage = async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    try {
      await armMessage(conditionId);
      setIsArmed(true);
      
      // Get updated deadline
      const deadlineDate = await getMessageDeadline(conditionId);
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
      setIsActionLoading(false);
    }
  };
  
  const handleDisarmMessage = async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    try {
      await disarmMessage(conditionId);
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
      setIsActionLoading(false);
    }
  };

  // Custom function to render recipients list with React components
  const renderRecipients = () => {
    const recipients = renderRecipientsList(condition);
    
    if (!recipients) {
      return <p className="text-muted-foreground text-sm">No recipients</p>;
    }
    
    return (
      <div className="space-y-2">
        {recipients.map((recipient: any) => (
          <div key={recipient.id} className="flex items-center text-sm">
            <span className="font-medium">{recipient.name}</span>
            <span className="text-muted-foreground ml-2 text-xs">({recipient.email})</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <MessageDetailContent
      message={message}
      isLoading={isLoading}
      isArmed={isArmed}
      isActionLoading={isActionLoading}
      deadline={deadline}
      conditionId={conditionId}
      condition={condition}
      handleDisarmMessage={handleDisarmMessage}
      handleArmMessage={handleArmMessage}
      handleDelete={handleDelete}
      formatDate={formatDate}
      renderConditionType={() => getConditionType(condition)}
      renderRecipients={renderRecipients}
    />
  );
}
