
import { useState, useCallback } from 'react';
import { MessageType } from '@/types/message';
import { useMessageForm } from '@/components/message/MessageFormContext';

export function useMessageTypeStore() {
  const { setMessageType } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  const onTextTypeClick = useCallback(() => {
    setMessageType('text');
  }, [setMessageType]);
  
  const onVideoTypeClick = useCallback(() => {
    setMessageType('video');
  }, [setMessageType]);
  
  const onAudioTypeClick = useCallback(() => {
    setMessageType('audio');
  }, [setMessageType]);
  
  return {
    initializedFromMessage,
    setInitializedFromMessage,
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick
  };
}
