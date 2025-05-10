
import { useState, useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";

/**
 * Hook to manage message type selection and state transitions
 */
export function useMessageTypeStore() {
  const { setMessageType } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  // Handle switching to text type
  const onTextTypeClick = useCallback(() => {
    console.log("Switching to text message type");
    setMessageType("text");
  }, [setMessageType]);
  
  // Handle switching to video type
  const onVideoTypeClick = useCallback(() => {
    console.log("Switching to video message type");
    setMessageType("video");
  }, [setMessageType]);
  
  // Handle switching to audio type
  const onAudioTypeClick = useCallback(() => {
    console.log("Switching to audio message type");
    setMessageType("audio");
  }, [setMessageType]);
  
  return {
    initializedFromMessage,
    setInitializedFromMessage,
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick
  };
}
