
import { FileAttachment } from "@/types/message";

// Re-export the FileAttachment type to fix import issues
export type { FileAttachment };

// Add any FileUploader functionality here if needed
export const createFileAttachmentFromFile = (file: File): FileAttachment => {
  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    isUploaded: false,
    uploading: false,
    progress: 0
  };
};
