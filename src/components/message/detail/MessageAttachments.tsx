
import { Message, MessageAttachment } from "@/types/message";
import { Paperclip } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AttachmentItem } from "./attachment/AttachmentItem";

interface MessageAttachmentsProps {
  message: Message;
  deliveryId?: string | null;
  recipientEmail?: string | null;
}

export function MessageAttachments({ message, deliveryId, recipientEmail }: MessageAttachmentsProps) {
  if (!message.attachments || message.attachments.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {message.attachments.map((attachment, index) => (
        <AttachmentItem
          key={index}
          attachment={{
            name: attachment.file_name,
            size: attachment.file_size,
            type: attachment.file_type,
            path: attachment.url
          }}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
        />
      ))}
    </div>
  );
}
