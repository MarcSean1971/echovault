
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/FileUploader";

interface FileAttachmentsSectionProps {
  files: File[];
  setFiles: (files: File[]) => void;
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
