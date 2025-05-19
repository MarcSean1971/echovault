
import React from "react";
import { Message } from "@/types/message";
import { TextContentSection } from "./TextContentSection";
import { VideoContentSection } from "./VideoContentSection";
import { LocationSection } from "./LocationSection";
import { useMessageAdditionalText } from "@/hooks/useMessageAdditionalText";
import { useMessageTranscription } from "@/hooks/useMessageTranscription";
import { MessageAttachments } from "@/components/message/detail/MessageAttachments";

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
  // Get text content immediately, then transcription asynchronously
  const { additionalText } = useMessageAdditionalText(message);
  const { transcription } = useMessageTranscription(message);
  
  // Render immediately with what we have - true progressive loading
  return (
    <div className="space-y-6">
      {/* Main message content - render immediately */}
      {message.message_type === "video" ? (
        <VideoContentSection 
          message={message} 
          additionalText={additionalText} 
          transcription={transcription} 
        />
      ) : (
        <TextContentSection 
          message={message} 
          additionalText={additionalText} 
        />
      )}
      
      {/* Attachments section - render if available (SWAPPED ORDER - now before location) */}
      {message.attachments && message.attachments.length > 0 && (
        <MessageAttachments
          message={message}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
        />
      )}
      
      {/* Location section - render if available (SWAPPED ORDER - now after attachments) */}
      {message.share_location && (
        <LocationSection 
          latitude={message.location_latitude} 
          longitude={message.location_longitude} 
          locationName={message.location_name} 
        />
      )}
      
      {/* WhatsApp section removed as requested */}
    </div>
  );
}
