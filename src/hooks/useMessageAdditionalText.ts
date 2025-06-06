
import { useState, useEffect } from "react";
import { Message } from "@/types/message";

export function useMessageAdditionalText(message: Message) {
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  
  // Extract additional text from video content
  useEffect(() => {
    if (!message.content) {
      setAdditionalText(null);
      return;
    }
    
    try {
      // Try to parse content as JSON
      const contentObj = JSON.parse(message.content);
      
      // Check if it has additionalText field
      if (contentObj.additionalText) {
        // If additionalText itself is JSON, try to parse and extract just the text value
        if (typeof contentObj.additionalText === 'string' && 
            contentObj.additionalText.trim().startsWith('{') && 
            contentObj.additionalText.trim().endsWith('}')) {
          try {
            const additionalTextObj = JSON.parse(contentObj.additionalText);
            // If it parsed successfully, just use the text property
            setAdditionalText(additionalTextObj.text || contentObj.additionalText);
          } catch (e) {
            // If it's not valid JSON, use it as is
            setAdditionalText(contentObj.additionalText);
          }
        } else {
          // Not JSON-formatted, use as is
          setAdditionalText(contentObj.additionalText);
        }
      } else {
        // No additional text found
        setAdditionalText(null);
      }
    } catch (e) {
      // If it's not JSON, use content as is for text messages
      if (message.message_type === 'text') {
        setAdditionalText(message.content);
      } else {
        setAdditionalText(null);
      }
    }
  }, [message.content, message.message_type]);
  
  return { additionalText };
}
