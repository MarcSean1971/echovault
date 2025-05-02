
import React from "react";
import { PaperclipIcon } from "lucide-react";
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
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <PaperclipIcon className="h-4 w-4" />
        Attachments ({message.attachments.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {message.attachments.map((attachment, index) => (
          <AttachmentItem key={index} attachment={attachment} />
        ))}
      </div>
    </div>
  );
}
