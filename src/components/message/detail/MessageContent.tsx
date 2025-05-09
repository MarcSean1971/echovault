
import React, { useEffect } from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "./content/TextMessageContent";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { AudioMessageContent } from "./content/AudioMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";
import { WhatsAppIntegration } from "./content/WhatsAppIntegration";
import { Separator } from "@/components/ui/separator";
import { MessageAttachments } from "./MessageAttachments";
import { parseMessageTranscription } from "@/services/messages/mediaService";

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
  // Extract transcription from message content
  const transcription = parseMessageTranscription(message.content);
  
  // Choose the appropriate content component based on message type
  const renderMessageContent = () => {
    switch (message.message_type) {
      case "text":
        return <TextMessageContent message={message} content={message.content} />;
      case "video":
        console.log("Rendering video message content with transcription:", transcription);
        return <VideoMessageContent message={message} transcription={transcription} />;
      case "audio":
        console.log("Rendering audio message content with transcription:", transcription);
        return <AudioMessageContent message={message} transcription={transcription} />;
      default:
        return <UnknownMessageContent message={message} />;
    }
  };
  
  // Log the message content and type for debugging
  useEffect(() => {
    console.log(`Rendering message content of type: ${message.message_type}`);
    if (message.message_type === "video" || message.message_type === "audio") {
      console.log("Media message content:", message.content);
    }
  }, [message]);
  
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
