
import { useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";

/**
 * Hook to handle additional text from message initialization
 */
export function useAdditionalTextHandler(additionalText: string | null, hasInitialized: boolean) {
  const { setTextContent } = useMessageForm();
  
  // Set additional text from message initialization
  useEffect(() => {
    if (additionalText && hasInitialized) {
      console.log("Setting additional text from message initialization:", 
                  additionalText.substring(0, 50) + (additionalText.length > 50 ? "..." : ""));
      setTextContent(additionalText);
    }
  }, [additionalText, hasInitialized, setTextContent]);
}
