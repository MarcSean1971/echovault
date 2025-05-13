
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

  // Determine which content to show - we'll make sure to only show one text component
  const shouldShowTextContent = message.message_type === "text";
  
  // For deadman's switch with content but not text message type
  const shouldShowDeadmansContent = isDeadmansSwitch && 
                               message.content && 
                               message.message_type !== "text" &&
                               !hasVideoContent;
  
  // For other message types with text but no video
  const shouldShowOtherTextContent = hasTextContent && 
                                !message.message_type.includes("text") && 
                                !message.message_type.includes("video") && 
                                !hasVideoContent && 
                                message.content &&
                                !shouldShowTextContent &&  // Make sure we don't duplicate
                                !shouldShowDeadmansContent; // Make sure we don't duplicate

  return (
    <div className="space-y-6">
      {/* Message content sections - With mutually exclusive conditions */}
      
      {/* Case 1: Regular text message */}
      {shouldShowTextContent && (
        <TextContentSection message={message} content={message.content} />
      )}
      
      {/* Case 2: Video message */}
      {message.message_type === "video" && (
        <VideoContentSection 
          message={message} 
          additionalText={additionalText} 
          transcription={transcription} 
        />
      )}
      
      {/* Case 3: For deadman's switch messages with content, show as text */}
      {shouldShowDeadmansContent && (
        <TextContentSection message={message} content={message.content} />
      )}
      
      {/* Case 4: For other message types with video content */}
      {!message.message_type.includes("text") && 
       !message.message_type.includes("video") && 
       hasVideoContent && (
        <VideoContentSection 
          message={message} 
          additionalText={additionalText} 
          transcription={transcription} 
        />
      )}
      
      {/* Case 5: For other message types with text content but no video - more restricted now */}
      {shouldShowOtherTextContent && (
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
