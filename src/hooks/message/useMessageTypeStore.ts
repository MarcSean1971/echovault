
import { useState, useEffect } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';

/**
 * Hook to manage message type selection and state
 */
export function useMessageTypeStore() {
  const { setMessageType, messageType } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  // Add debug logging when initialization state changes
  useEffect(() => {
    console.log("MessageTypeStore: initializedFromMessage changed to", initializedFromMessage);
  }, [initializedFromMessage]);
  
  // Add debug logging when message type changes
  useEffect(() => {
    console.log("MessageTypeStore: messageType changed to", messageType);
  }, [messageType]);
  
  // Handle clicking on text tab
  const onTextTypeClick = () => {
    console.log("Text message type selected");
    setMessageType('text');
  };
  
  // Handle clicking on video tab
  const onVideoTypeClick = () => {
    console.log("Video message type selected");
    setMessageType('video');
  };
  
  // Handle clicking on audio tab
  const onAudioTypeClick = () => {
    console.log("Audio message type selected");
    setMessageType('audio');
  };
  
  return {
    initializedFromMessage,
    setInitializedFromMessage,
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick
  };
}
