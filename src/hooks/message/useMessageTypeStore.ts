
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';

/**
 * Hook to manage message type selection and state
 */
export function useMessageTypeStore() {
  const { setMessageType } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
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
