
import { AttachmentItem } from "./AttachmentItem";
import { Message } from "@/types/message";
import { Paperclip } from "lucide-react";

interface MessageAttachmentsProps {
  message: Message;
  deliveryId?: string;
  recipientEmail?: string;
}

export function MessageAttachments({ message, deliveryId, recipientEmail }: MessageAttachmentsProps) {
  if (!message.attachments || message.attachments.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-md font-medium">Attachments</h3>
      </div>
      <div className="space-y-2">
        {message.attachments.map((attachment, index) => (
          <AttachmentItem
            key={index}
            attachment={attachment}
            deliveryId={deliveryId}
            recipientEmail={recipientEmail}
          />
        ))}
      </div>
    </div>
  );
}
