
import { useState } from 'react';

/**
 * Hook to manage initialization state for media content
 */
export function useMessageMediaStore() {
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  return {
    initializedFromMessage,
    setInitializedFromMessage
  };
}
