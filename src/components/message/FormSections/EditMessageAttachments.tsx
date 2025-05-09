
import { AttachmentItem } from "../detail/attachment/AttachmentItem";
import { AttachmentProps } from "../detail/attachment/types";

interface EditMessageAttachmentsProps {
  attachments: AttachmentProps[];
}

export function EditMessageAttachments({ attachments }: EditMessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2 mb-3">
      <p className="text-sm text-muted-foreground mb-2">Current attachments:</p>
      {attachments.map((attachment, index) => (
        <AttachmentItem
          key={index}
          attachment={attachment}
        />
      ))}
    </div>
  );
}
