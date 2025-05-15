
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/types/message";
import { MessageAttachments } from "../MessageAttachments";

interface MessageBodyProps {
  message: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
}

export function MessageBody({ message, deliveryId, recipientEmail }: MessageBodyProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="prose max-w-none dark:prose-invert">
          {message.content ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <p className="text-muted-foreground">No message content</p>
          )}
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium mb-3">Attachments</h3>
            <MessageAttachments 
              message={message} 
              deliveryId={deliveryId}
              recipientEmail={recipientEmail}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
