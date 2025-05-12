
import React, { useEffect } from "react";
import { Message } from "@/types/message";
import { Separator } from "@/components/ui/separator";
import { MessageAttachments } from "../../MessageAttachments";
import { TextContentSection } from "./TextContentSection";
import { VideoContentSection } from "./VideoContentSection";
import { LocationSection } from "./LocationSection";
import { WhatsAppSection } from "./WhatsAppSection";
import { useMessageContentTypes } from "./useMessageContentTypes";

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
  const {
    hasVideoContent,
    hasTextContent,
    additionalText,
    transcription,
    isDeadmansSwitch,
    isMessageDetailPage
  } = useMessageContentTypes(message, conditionType);
  
  // Determine if this is a panic trigger message with WhatsApp configuration
  const isPanicTrigger = message.message_type === "panic_trigger";
  const hasPanicConfig = message.panic_config || message.panic_trigger_config;

  // Check if message has location data
  const hasLocationData = message.share_location && 
                         message.location_latitude && 
                         message.location_longitude;

  return (
    <div className="space-y-6">
      {/* Message content sections */}
      {message.message_type === "text" && (
        <TextContentSection message={message} content={message.content} />
      )}
      
      {message.message_type === "video" && (
        <VideoContentSection 
          message={message} 
          additionalText={additionalText} 
          transcription={transcription} 
        />
      )}
      
      {/* For deadman's switch messages with content, show as text */}
      {isDeadmansSwitch && message.content && message.message_type !== "text" && (
        <TextContentSection message={message} content={message.content} />
      )}
      
      {/* For other message types with video content */}
      {!message.message_type.includes("text") && 
       !message.message_type.includes("video") && 
       hasVideoContent && (
        <VideoContentSection 
          message={message} 
          additionalText={additionalText} 
          transcription={transcription} 
        />
      )}
      
      {/* For other message types with text content but no video */}
      {hasTextContent && 
       !message.message_type.includes("text") && 
       !message.message_type.includes("video") && 
       !hasVideoContent && 
       message.content && (
        <TextContentSection message={message} content={message.content} />
      )}
      
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
        <LocationSection 
          latitude={message.location_latitude!}
          longitude={message.location_longitude!}
          locationName={message.location_name}
        />
      )}
      
      {/* WhatsApp Integration for panic triggers */}
      {isPanicTrigger && hasPanicConfig && (
        <WhatsAppSection 
          messageId={message.id}
          panicConfig={message.panic_config || message.panic_trigger_config}
        />
      )}
    </div>
  );
}
