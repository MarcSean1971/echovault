
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { MessageLoading } from "@/components/message/detail/MessageLoading";
import { MessageNotFound } from "@/components/message/detail/MessageNotFound";
import { MessageDetailContent } from "@/components/message/detail/MessageDetailContent";
import { formatDate, getConditionType } from "@/utils/messageHelpers";
import { useMessageDetail } from "@/hooks/useMessageDetail";
import { deleteMessage, handleArmMessage, handleDisarmMessage } from "@/services/messages/messageDetailService";
import { MessageRecipientsList } from "@/components/message/detail/MessageRecipientsList";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Use our custom hook to fetch the message data
  const { 
    message, 
    isLoading, 
    isArmed, 
    deadline, 
    conditionId, 
    condition, 
    recipients,
    setIsArmed
  } = useMessageDetail(id, () => navigate("/messages"));
  
  const handleMessageDelete = async () => {
    if (!message) return;
    const success = await deleteMessage(message.id);
    if (success) {
      navigate("/messages");
    }
  };
  
  const onArmMessage = async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    const newDeadline = await handleArmMessage(conditionId, setIsArmed);
    setIsActionLoading(false);
  };
  
  const onDisarmMessage = async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    await handleDisarmMessage(conditionId, setIsArmed);
    setIsActionLoading(false);
  };

  // Custom function to render recipients list with React components
  const renderRecipients = () => {
    return <MessageRecipientsList recipients={recipients} />;
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
      handleDisarmMessage={onDisarmMessage}
      handleArmMessage={onArmMessage}
      handleDelete={handleMessageDelete}
      formatDate={formatDate}
      renderConditionType={() => getConditionType(condition)}
      renderRecipients={renderRecipients}
      recipients={recipients}
    />
  );
}
