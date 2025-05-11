
import React from "react";
import { FileAttachment } from "@/components/FileUploader";
import { FormAttachmentItem } from "./FormAttachmentItem";

interface FormAttachmentsListProps {
  attachments: FileAttachment[];
}

export function FormAttachmentsList({ attachments }: FormAttachmentsListProps) {
  // Filter only attachments that have been uploaded or have a path
  const viewableAttachments = attachments.filter(att => att.path || att.isUploaded);
  
  if (viewableAttachments.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3 mt-4">
      <h4 className="text-sm font-medium text-muted-foreground">Preview uploaded files</h4>
      <div className="space-y-2">
        {viewableAttachments.map((attachment, index) => (
          <FormAttachmentItem key={index} attachment={attachment} />
        ))}
      </div>
    </div>
  );
}
