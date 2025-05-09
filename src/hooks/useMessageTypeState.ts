
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeState() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  const [messageType, setMessageType] = useState("text");
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: string) => {
    setMessageType(type);
    setContextMessageType(type);
  };

  return {
    messageType,
    setMessageType,
    handleMessageTypeChange
  };
}
