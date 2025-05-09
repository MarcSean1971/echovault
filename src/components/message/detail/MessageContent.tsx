
import React, { useEffect, useState } from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "./content/TextMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";
import { WhatsAppIntegration } from "./content/WhatsAppIntegration";
import { Separator } from "@/components/ui/separator";
import { MessageAttachments } from "./MessageAttachments";
import { parseVideoContent } from "@/services/messages/mediaService";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { AudioMessageContent } from "./content/AudioMessageContent";

export interface MessageContentProps {
  message: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
}

export function MessageContent({ 
  message,
  deliveryId,
  recipientEmail
}: MessageContentProps) {
  const [hasVideoContent, setHasVideoContent] = useState(false);
  const [hasAudioContent, setHasAudioContent] = useState(false);
  const [hasTextContent, setHasTextContent] = useState(false);
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  
  // Check for different types of content
  useEffect(() => {
    if (!message.content) return;
    
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
            // If we have additional text with video, we consider it as having text content too
            setHasTextContent(true);
          }
        } catch (e) {
          console.error("Error parsing additional text from video content:", e);
        }
      }
    } catch (e) {
      setHasVideoContent(false);
    }
    
    // Check for audio content
    try {
      const contentObj = JSON.parse(message.content);
      if (contentObj.audioData) {
        setHasAudioContent(true);
        
        // If we have additional text with audio, we consider it as having text content too
        if (contentObj.additionalText) {
          setAdditionalText(contentObj.additionalText);
          setHasTextContent(true);
        }
      }
    } catch (e) {
      setHasAudioContent(false);
    }
    
    // For text content, we consider any non-JSON content or message type="text" as text
    if (message.message_type === "text" || !message.content.trim().startsWith("{")) {
      setHasTextContent(true);
    }
  }, [message.content, message.message_type]);
  
  // Log for debugging purposes
  useEffect(() => {
    console.log(`MessageContent: Rendering message of type: ${message.message_type}`);
    console.log("MessageContent: Message content:", message.content ? message.content.substring(0, 100) + "..." : null);
    console.log("MessageContent: Has video content:", hasVideoContent);
    console.log("MessageContent: Has audio content:", hasAudioContent);
    console.log("MessageContent: Has text content:", hasTextContent);
    console.log("MessageContent: Additional text:", additionalText);
  }, [message, hasVideoContent, hasAudioContent, hasTextContent, additionalText]);

  // Choose the appropriate content components based on message type and content
  const renderMessageContent = () => {
    return (
      <>
        {/* If this is a video message type or contains video data, show video content */}
        {(message.message_type === "video" || hasVideoContent) && (
          <div className="mb-6">
            <VideoMessageContent message={message} />
          </div>
        )}
        
        {/* If this is an audio message or contains audio data, show audio content */}
        {(message.message_type === "audio" || hasAudioContent) && (
          <div className="mb-6">
            <AudioMessageContent message={message} />
          </div>
        )}
        
        {/* If this is text only or we have additional text, show text content */}
        {(message.message_type === "text" && !hasVideoContent && !hasAudioContent) || additionalText ? (
          <TextMessageContent 
            message={message} 
            content={additionalText || message.content} 
          />
        ) : null}
        
        {/* If we don't recognize the content type, use the unknown component */}
        {!hasVideoContent && !hasAudioContent && !hasTextContent && !additionalText && (
          <UnknownMessageContent message={message} />
        )}
      </>
    );
  };

  // Check if this is a panic trigger message with WhatsApp configuration
  const isPanicTrigger = message.message_type === "panic_trigger";
  const hasPanicConfig = message.panic_config || message.panic_trigger_config;

  return (
    <div className="space-y-6">
      {/* Message content */}
      <div className="prose max-w-none dark:prose-invert">
        {renderMessageContent()}
      </div>
      
      {/* Attachments section */}
      {message.attachments && message.attachments.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Attachments</h3>
          <MessageAttachments 
            message={message}
            deliveryId={deliveryId}
            recipientEmail={recipientEmail}
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
