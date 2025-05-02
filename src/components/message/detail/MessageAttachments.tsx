
import { AttachmentItem } from "./AttachmentItem";
import { Message } from "@/types/message";

interface MessageAttachmentsProps {
  message: Message;
}

export function MessageAttachments({ message }: MessageAttachmentsProps) {
  if (!message.attachments || message.attachments.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments</h3>
      <div className="space-y-2">
        {message.attachments.map((attachment, index) => (
          <AttachmentItem
            key={index}
            name={attachment.name}
            size={attachment.size}
            type={attachment.type}
            path={attachment.path}
          />
        ))}
      </div>
    </div>
  );
}
