
import { Pencil } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { useNavigate } from "react-router-dom";

interface EditMessageButtonProps {
  messageId: string;
  isArmed: boolean;
  isActionLoading: boolean;
}

export function EditMessageButton({
  messageId,
  isArmed,
  isActionLoading
}: EditMessageButtonProps) {
  const navigate = useNavigate();
  
  const handleEditClick = () => {
    navigate(`/message/${messageId}/edit`);
  };
  
  return (
    <ActionButton
      icon={Pencil}
      label="Edit Message"
      onClick={handleEditClick}
      disabled={isArmed || isActionLoading}
      tooltipText={isArmed ? "Disarm the message first to edit it" : undefined}
    />
  );
}
