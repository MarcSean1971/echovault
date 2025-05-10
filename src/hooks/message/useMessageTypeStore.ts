
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';
import { useMessageMediaStore } from './useMessageMediaStore';

/**
 * Hook for managing message type and media initialization state
 */
export function useMessageTypeStore() {
  const { messageType, setMessageType } = useMessageForm();
  
  // Use our message media store for initialization state
  const {
    initializedFromMessage,
    setInitializedFromMessage
  } = useMessageMediaStore();
  
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
    messageType,
    initializedFromMessage,
    setInitializedFromMessage,
    onTextTypeClick,
    onVideoTypeClick, 
    onAudioTypeClick
  };
}
