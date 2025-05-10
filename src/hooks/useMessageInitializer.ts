
import { useEffect, useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { parseVideoContent } from '@/services/messages/mediaService';
import { useInitializeMediaContent } from "./useInitializeMediaContent";

/**
 * Hook to initialize message data when editing an existing message
 */
export function useMessageInitializer(message?: Message) {
  const { 
    setMessageType: setContextMessageType,
    setContent,
    setTextContent,
    setVideoContent,
    setAudioContent
  } = useMessageForm();
  
  // Use our media content initializer hook
  const {
    videoUrl,
    videoBlob,
    videoBase64,
    audioUrl,
    audioBlob,
    audioBase64,
    hasInitialized,
    additionalText
  } = useInitializeMediaContent(message || null);

  // Set initial message type based on the message being edited
  useEffect(() => {
    if (message?.message_type) {
      console.log("Initializing message type:", message.message_type);
      setContextMessageType(message.message_type);
    }
  }, [message, setContextMessageType]);

  // Initialize message content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    console.log("Initializing message content for editing:", 
                message.content.substring(0, 100) + "...");
    console.log("Message type:", message.message_type);
    
    // Set form content regardless of message type
    setContent(message.content);
    
    // Reset all content types first to avoid overlap
    setTextContent('');
    setVideoContent('');
    setAudioContent('');
    
    // Check if the content has video or audio data
    let hasVideo = false;
    let hasAudio = false;
    
    try {
      // Check for video content
      const { videoData } = parseVideoContent(message.content);
      hasVideo = !!videoData;
      
      // If we have video content, store it
      if (hasVideo || message.message_type === "video") {
        console.log("Message contains video content - setting videoContent state");
        setVideoContent(message.content);
        
        // Check for additional text in the video content
        try {
          const contentObj = JSON.parse(message.content);
          if (contentObj.additionalText) {
            console.log("Message contains additional text with video:", contentObj.additionalText);
            // Only set text content if we're in video mode - this is crucial!
            if (message.message_type === "video") {
              setTextContent(contentObj.additionalText);
            }
          }
        } catch (e) {
          console.error("Error parsing additional text from video content:", e);
        }
      }
      
      // Check for audio content
      try {
        const contentObj = JSON.parse(message.content);
        if (contentObj.audioData || message.message_type === "audio") {
          console.log("Message contains audio content - setting audioContent state");
          hasAudio = true;
          setAudioContent(message.content);
          
          // Check for additional text in the audio content
          if (contentObj.additionalText) {
            console.log("Message contains additional text with audio:", contentObj.additionalText);
            // Only set text content if we're in audio mode - this is crucial!
            if (message.message_type === "audio") {
              setTextContent(contentObj.additionalText);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing audio content:", e);
      }
    } catch (e) {
      hasVideo = false;
    }
    
    // For text content, we consider any non-JSON content or message type="text" as text
    if (message.message_type === "text") {
      // If this is a true text message, just set the text content directly
      setTextContent(message.content);
    }
    
  }, [message, setContent, setTextContent, setVideoContent, setAudioContent]);

  return {
    videoUrl,
    videoBlob,
    videoBase64,
    audioUrl,
    audioBlob,
    audioBase64,
    hasInitialized,
    additionalText
  };
}
