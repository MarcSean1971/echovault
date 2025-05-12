
import React, { useEffect, useState } from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "./content/TextMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";
import { WhatsAppIntegration } from "./content/WhatsAppIntegration";
import { Separator } from "@/components/ui/separator";
import { MessageAttachments } from "./MessageAttachments";
import { parseMessageTranscription, parseVideoContent } from "@/services/messages/mediaService";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { LocationDisplay } from "./content/LocationDisplay";

export interface MessageContentProps {
  message: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
  conditionType?: string;
}

export function MessageContent({ 
  message,
  deliveryId,
  recipientEmail,
  conditionType
}: MessageContentProps) {
  // Extract transcription from message content
  const transcription = parseMessageTranscription(message.content);
  const [hasVideoContent, setHasVideoContent] = useState(false);
  const [hasTextContent, setHasTextContent] = useState(false);
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  
  // Check if this is a deadman's switch message
  const isDeadmansSwitch = conditionType === 'no_check_in';
  
  // Check for different types of content
  useEffect(() => {
    if (!message.content) {
      setHasTextContent(message.message_type === "text"); // Set text content true for text type even if empty
      return;
    }

    // Check for video content
    try {
      const { videoData } = parseVideoContent(message.content);
      setHasVideoContent(!!videoData);
      
      // If we have video content, check for additional text
      if (videoData) {
        try {
          const contentObj = JSON.parse(message.content);
          if (contentObj.additionalText) {
            setAdditionalText(contentObj.additionalText);
          }
        } catch (e) {
          console.error("Error parsing additional text from video content:", e);
        }
      }
    } catch (e) {
      setHasVideoContent(false);
    }
    
    // For text content, consider any content as text if message type is "text"
    if (message.message_type === "text") {
      setHasTextContent(true);
    } 
    // For non-text message types, check if content could be text
    else if (!message.content.trim().startsWith("{") || 
             message.content.trim() === "{}" || 
             message.content.trim() === "null") {
      setHasTextContent(true);
    }
  }, [message.content, message.message_type]);
  
  // Log for debugging purposes
  useEffect(() => {
    console.log(`MessageContent: Rendering message of type: ${message.message_type}`);
    console.log("MessageContent: Message content:", message.content ? message.content.substring(0, 100) + "..." : null);
    console.log("MessageContent: Has video content:", hasVideoContent);
    console.log("MessageContent: Has text content:", hasTextContent);
    console.log("MessageContent: Additional text:", additionalText);
    console.log("MessageContent: Is deadman's switch:", isDeadmansSwitch);
  }, [message, hasVideoContent, hasTextContent, additionalText, isDeadmansSwitch]);

  // Choose the appropriate content components based on message type and content
  const renderMessageContent = () => {
    // For text message types, always show the TextMessageContent
    if (message.message_type === "text") {
      return <TextMessageContent message={message} content={message.content} />;
    }
    
    // For deadman's switch, show as text regardless of type
    if (isDeadmansSwitch) {
      return <TextMessageContent message={message} content={message.content} />;
    }

    return (
      <>
        {/* If there's additional text from a video message, show it */}
        {additionalText && (
          <div className="mb-6">
            <TextMessageContent message={{...message, content: additionalText}} content={additionalText} />
          </div>
        )}
        
        {/* Show video content if it exists */}
        {(message.message_type === "video" || hasVideoContent) && (
          <div className="mb-6">
            <VideoMessageContent message={message} />
          </div>
        )}
        
        {/* For regular text content that isn't part of a video */}
        {hasTextContent && !additionalText && message.message_type !== "video" && !hasVideoContent && (
          <TextMessageContent message={message} content={message.content} />
        )}
        
        {/* If we don't recognize the content type, use the unknown component */}
        {!hasVideoContent && !hasTextContent && !additionalText && (
          <UnknownMessageContent message={message} />
        )}
      </>
    );
  };

  // Check if this is a panic trigger message with WhatsApp configuration
  const isPanicTrigger = message.message_type === "panic_trigger";
  const hasPanicConfig = message.panic_config || message.panic_trigger_config;

  // Check if message has location data
  const hasLocationData = message.share_location && 
                         message.location_latitude && 
                         message.location_longitude;

  return (
    <div className="space-y-6">
      {/* Message content */}
      <div className="prose max-w-none dark:prose-invert">
        {renderMessageContent()}
      </div>
      
      {/* Attachments section */}
      {message.attachments && message.attachments.length > 0 && (
        <div>
          <Separator className="my-4" />
          <h3 className="text-lg font-medium mb-3">Attachments</h3>
          <MessageAttachments 
            message={message}
            deliveryId={deliveryId}
            recipientEmail={recipientEmail}
          />
        </div>
      )}
      
      {/* Location display section */}
      {hasLocationData && (
        <div className="mt-6">
          <Separator className="my-4" />
          <LocationDisplay 
            latitude={message.location_latitude} 
            longitude={message.location_longitude}
            locationName={message.location_name}
          />
        </div>
      )}
      
      {/* WhatsApp Integration for panic triggers */}
      {isPanicTrigger && hasPanicConfig && (
        <>
          <Separator className="my-4" />
          <WhatsAppIntegration 
            messageId={message.id}
            panicConfig={message.panic_config || message.panic_trigger_config}
          />
        </>
      )}
    </div>
  );
}

