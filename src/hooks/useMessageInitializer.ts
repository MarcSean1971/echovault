
import { useState, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useInitializeMediaContent } from "./useInitializeMediaContent";
import { Message, MessageType } from "@/types/message";

export function useMessageInitializer(message: Message | null) {
  const { 
    setTitle, 
    setContent, 
    setTextContent, 
    setMessageType, 
    setShareLocation,
    setLocationLatitude,
    setLocationLongitude,
    setLocationName
  } = useMessageForm();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize media content (will handle video/audio content)
  const mediaContent = useInitializeMediaContent(message);
  
  // Initialize message data
  useEffect(() => {
    if (!message || isInitialized) return;
    
    console.log("Initializing message data:", message.id);
    
    // Set basic message properties
    setTitle(message.title || '');
    
    // Handle content based on message type
    if (message.content) {
      console.log("Setting content for message type:", message.message_type);
      
      // Handle different message types
      const msgType = message.message_type as MessageType;
      
      // Set content appropriately
      if (msgType === 'text') {
        setTextContent(message.content);
      }
      
      // Always set the base content
      setContent(message.content);
      
      // Set the message type
      setMessageType(msgType);
    }
    
    // Set location data if available
    if (message.share_location) {
      setShareLocation(true);
      
      if (message.location_latitude) {
        setLocationLatitude(message.location_latitude);
      }
      
      if (message.location_longitude) {
        setLocationLongitude(message.location_longitude);
      }
      
      if (message.location_name) {
        setLocationName(message.location_name);
      }
    }
    
    setIsInitialized(true);
    console.log("Message initialization complete");
  }, [message, isInitialized, setTitle, setContent, setTextContent, setMessageType, 
      setShareLocation, setLocationLatitude, setLocationLongitude, setLocationName]);
  
  return {
    hasInitialized: isInitialized,
    ...mediaContent
  };
}
