
import { Message, MessageAttachment } from "@/types/message";
import { Card } from "@/components/ui/card";

export interface MessageContentProps {
  message: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
}

export function MessageContent({ message, deliveryId, recipientEmail }: MessageContentProps) {
  if (!message) {
    return <p>No message content available.</p>;
  }

  return (
    <div className="message-content">
      {/* Display the message content as plain text or formatted HTML */}
      {message.message_type === 'text' ? (
        <div className="whitespace-pre-wrap">{message.content}</div>
      ) : (
        <Card className="p-4">
          <p>This message type is not supported.</p>
        </Card>
      )}
    </div>
  );
}
