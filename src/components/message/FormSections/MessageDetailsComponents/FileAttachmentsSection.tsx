
import { Label } from "@/components/ui/label";
import { FileUploader, FileAttachment } from "@/components/FileUploader";

interface FileAttachmentsSectionProps {
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
}

export function FileAttachmentsSection({ files, setFiles }: FileAttachmentsSectionProps) {
  return (
    <div className="space-y-2">
      <Label>File Attachments</Label>
      <FileUploader 
        files={files} 
        onChange={setFiles} 
      />
    </div>
  );
}
