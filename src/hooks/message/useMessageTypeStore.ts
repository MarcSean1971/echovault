
import { create } from 'zustand';

interface MessageTypeState {
  messageType: 'text';
  setMessageType: (type: 'text') => void;
}

// Simplified message type store that only supports text messages
export const useMessageTypeStore = create<MessageTypeState>((set) => ({
  messageType: 'text',
  setMessageType: (type) => {
    if (type !== 'text') {
      console.warn(`Message type ${type} not supported, defaulting to text`);
      set({ messageType: 'text' });
    } else {
      set({ messageType: type });
    }
  },
}));

// Helper hooks
export const useTextMode = () => {
  const { messageType, setMessageType } = useMessageTypeStore();
  const isTextMode = messageType === 'text';
  
  const activateTextMode = () => setMessageType('text');
  
  return { isTextMode, activateTextMode };
};

// For compatibility with code that expects these hooks
export const useVideoMode = () => {
  const { messageType } = useMessageTypeStore();
  const isVideoMode = false; // Always false since we only support text
  
  const activateVideoMode = () => {
    console.warn("Video mode not supported, falling back to text");
    // Always use text mode
    useMessageTypeStore.getState().setMessageType('text');
  };
  
  return { isVideoMode, activateVideoMode };
};

export const useAudioMode = () => {
  const { messageType } = useMessageTypeStore();
  const isAudioMode = false; // Always false since we only support text
  
  const activateAudioMode = () => {
    console.warn("Audio mode not supported, falling back to text");
    // Always use text mode
    useMessageTypeStore.getState().setMessageType('text');
  };
  
  return { isAudioMode, activateAudioMode };
};
