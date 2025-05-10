
import { useEffect } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';

/**
 * Hook to handle additional text from message initialization
 */
export function useAdditionalTextHandler(additionalText: string | null, hasInitialized: boolean) {
  const { setTextContent } = useMessageForm();
  
  // Handle additional text from message initialization
  useEffect(() => {
    if (additionalText && hasInitialized) {
      console.log("MessageTextHandler: Setting additional text from message:", additionalText.substring(0, 50));
      setTextContent(additionalText);
    }
  }, [additionalText, setTextContent, hasInitialized]);
  
  return {
    setAdditionalText: setTextContent
  };
}
