
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { MessageType } from "@/types/message";

export function useMessageTypeState() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  const [messageType, setMessageType] = useState<MessageType>("text");
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: MessageType) => {
    setMessageType(type);
    setContextMessageType(type);
  };

  return {
    messageType,
    setMessageType,
    handleMessageTypeChange
  };
}
