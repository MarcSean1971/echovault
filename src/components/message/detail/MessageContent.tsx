
import React from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "./content/TextMessageContent";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { AudioMessageContent } from "./content/AudioMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";
import { MessageAttachments } from "./MessageAttachments";
import { WhatsAppIntegration } from "./content/WhatsAppIntegration";
import { Separator } from "@/components/ui/separator";

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
  // Choose the appropriate content component based on message type
  const renderMessageContent = () => {
    switch (message.message_type) {
      case "text":
        return <TextMessageContent message={message} content={message.content} />;
      case "video":
        return <VideoMessageContent message={message} />;
      case "audio":
        return <AudioMessageContent message={message} />;
      default:
        return <UnknownMessageContent message={message} />;
    }
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
      
      {/* Message attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <>
          <Separator className="my-4" />
          <MessageAttachments 
            message={message}
            deliveryId={deliveryId}
            recipientEmail={recipientEmail}
          />
        </>
      )}
    </div>
  );
}
