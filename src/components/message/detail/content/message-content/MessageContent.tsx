
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { TextContentSection } from "./TextContentSection";
import { VideoContentSection } from "../VideoContentSection";
import { LocationSection } from "./LocationSection";
import { WhatsAppSection } from "./WhatsAppSection";
import { useMessageAdditionalText } from "@/hooks/useMessageAdditionalText";
import { useMessageTranscription } from "@/hooks/useMessageTranscription";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isReady, setIsReady] = useState(false);
  const { additionalText } = useMessageAdditionalText(message);
  const { transcription } = useMessageTranscription(message);
  
  // Immediate mounting effect to show content
  useEffect(() => {
    // Set ready state immediately - no artificial delay
    setIsReady(true);
  }, []);
  
  // Progressive loading approach - render immediately with what we have
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
      
      {/* Location section - render if available */}
      {message.share_location && (
        <LocationSection 
          latitude={message.location_latitude} 
          longitude={message.location_longitude} 
          locationName={message.location_name} 
        />
      )}
      
      {/* WhatsApp section */}
      <WhatsAppSection 
        message={message} 
        deliveryId={deliveryId} 
        recipientEmail={recipientEmail} 
      />
    </div>
  );
}
