import { useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to initialize message data when editing an existing message
 */
export function useMessageInitializer(message?: Message) {
  const { 
    setMessageType: setContextMessageType,
    setContent,
    setTextContent
  } = useMessageForm();
  
  // Set initial message type based on the message being edited
  useEffect(() => {
    if (message?.message_type) {
      console.log("Initializing message type:", message.message_type);
      
      // If the message type is audio or video, convert it to text
      if (message.message_type === 'audio' || message.message_type === 'video') {
        setContextMessageType('text');
        
        // Show a notification about conversion to text
        toast({
          title: "Message Type Converted",
          description: "Audio and video messages are no longer supported. Your message has been converted to text.",
          variant: "default",
          duration: 5000
        });
      } else {
        // For text messages, keep the type as is
        setContextMessageType('text');
      }
    }
  }, [message, setContextMessageType]);

  // Initialize message content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    console.log("Initializing message content for editing:", 
                message.content.substring(0, 100) + "...");
    
    // Set form content
    setContent(message.content);
    
    // Try to extract text content from media messages
    let textContent = message.content;
    
    try {
      // Check for additional text in media content
      const contentObj = JSON.parse(message.content);
      if (contentObj.additionalText) {
        console.log("Message contains additional text:", contentObj.additionalText);
        textContent = contentObj.additionalText;
      }
    } catch (e) {
      // If it's not JSON, it's likely just text
      console.log("Message content appears to be plain text");
    }
    
    // Set text content state
    setTextContent(textContent);
    
  }, [message, setContent, setTextContent]);

  return { hasInitialized: true };
}
