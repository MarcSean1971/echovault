
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
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  
  // Check if we're on the message detail page
  const isMessageDetailPage = location.pathname.includes('/message/') && !location.pathname.includes('/edit');
  
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
            console.log("Found additional text:", contentObj.additionalText);
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
  
  // Debug logging for better understanding of content flow
  useEffect(() => {
    console.log(`MessageContent: Rendering message of type: ${message.message_type}`);
    console.log("MessageContent: Message content:", message.content ? message.content.substring(0, 100) + "..." : null);
    console.log("MessageContent: Has video content:", hasVideoContent);
    console.log("MessageContent: Has text content:", hasTextContent);
    console.log("MessageContent: Additional text:", additionalText);
    console.log("MessageContent: Is deadman's switch:", isDeadmansSwitch);
    console.log("MessageContent: Is message detail page:", isMessageDetailPage);
    if (message.message_type === "video") {
      console.log("MessageContent: This is a video message");
      try {
        const { videoData } = parseVideoContent(message.content);
        console.log("MessageContent: Video data available:", !!videoData);
      } catch (e) {
        console.error("Error parsing video data:", e);
      }
    }
  }, [message, hasVideoContent, hasTextContent, additionalText, isDeadmansSwitch, isMessageDetailPage]);

  // Completely rebuilt renderMessageContent function with simplified logic that prioritizes content display
  const renderMessageContent = () => {
    // For text message types, always show the TextMessageContent
    if (message.message_type === "text") {
      return (
        <div className="mb-4">
          <TextMessageContent message={message} content={message.content} />
        </div>
      );
    }
    
    // For video messages, follow the pattern used in edit mode: show both video and text when available
    if (message.message_type === "video") {
      return (
        <>
          {/* First show video content */}
          <div className="mb-6">
            <VideoMessageContent message={message} />
          </div>
          
          {/* Then show transcription if available */}
          {transcription && (
            <div className="mt-6 mb-4">
              <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
              <div className="p-3 bg-muted/40 rounded-md">
                <p className="whitespace-pre-wrap">{transcription}</p>
              </div>
            </div>
          )}
          
          {/* Show additional text if available */}
          {additionalText && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
              <TextMessageContent message={{...message, content: additionalText}} content={additionalText} />
            </div>
          )}
        </>
      );
    }
    
    // For deadman's switch messages, show as text regardless of type
    if (isDeadmansSwitch && message.content) {
      return (
        <div className="mb-4">
          <TextMessageContent message={message} content={message.content} />
        </div>
      );
    }
    
    // Fallback for other content types - check for video content first
    if (hasVideoContent) {
      return (
        <>
          {/* First show video content */}
          <div className="mb-6">
            <VideoMessageContent message={message} />
          </div>
          
          {/* Then show additional text if available */}
          {additionalText && (
            <div className="mt-4">
              <TextMessageContent message={{...message, content: additionalText}} content={additionalText} />
            </div>
          )}
        </>
      );
    }
    
    // If we have text content but no video
    if (hasTextContent && message.content) {
      return (
        <div className="mb-4">
          <TextMessageContent message={message} content={message.content} />
        </div>
      );
    }
    
    // If nothing else matches, use the unknown component
    return <UnknownMessageContent message={message} />;
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
