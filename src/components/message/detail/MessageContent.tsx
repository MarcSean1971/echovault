
import React from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "./content/TextMessageContent";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface MessageContentProps {
  message: Message;
}

export function MessageContent({ message }: MessageContentProps) {
  // Determine if the message was originally an audio or video message
  const isFormerMediaMessage = message.message_type === 'audio' || message.message_type === 'video';
  
  // Extract any text content from former media messages
  const getTextFromMediaMessage = () => {
    try {
      const contentObj = JSON.parse(message.content);
      if (contentObj.additionalText) {
        return contentObj.additionalText;
      }
      return "This was a media message. Media content is no longer supported.";
    } catch (e) {
      return message.content;
    }
  };
  
  return (
    <div className="space-y-4">
      {isFormerMediaMessage && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mr-2 h-5 w-5 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Former {message.message_type} message</h4>
              <p className="text-sm text-muted-foreground">
                This message was originally created as a {message.message_type} message. 
                Media content is no longer supported.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      <TextMessageContent 
        content={isFormerMediaMessage ? getTextFromMediaMessage() : message.content} 
      />
    </div>
  );
}
