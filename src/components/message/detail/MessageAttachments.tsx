
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
    <div className={`space-y-2 ${HOVER_TRANSITION}`}>
      {message.attachments.map((attachment, index) => {
        const attachmentProps = {
          name: attachment.file_name || attachment.name || "Unknown file",
          size: attachment.file_size || attachment.size || 0,
          type: attachment.file_type || attachment.type || "",
          path: attachment.url || attachment.path || ""
        };
        
        return (
          <AttachmentItem
            key={index}
            attachment={attachmentProps}
            deliveryId={deliveryId}
            recipientEmail={recipientEmail}
          />
        );
      })}
    </div>
  );
}
