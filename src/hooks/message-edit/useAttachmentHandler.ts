
import { toast } from "@/components/ui/use-toast";
import { uploadAttachments } from "@/services/messages/fileService";

export function useAttachmentHandler() {
  const handleAttachments = async (userId: string, files: any[], messageAttachments: any[] | null) => {
    let attachmentsToSave = [...(messageAttachments || [])].filter(
      // Filter out any deleted attachments
      attachment => files.some(f => f.path === attachment.path)
    );
    
    // Upload any new files that haven't been uploaded
    const newFiles = files.filter(f => f.file && !f.isUploaded);
    
    if (newFiles.length > 0) {
      const uploadedFiles = await uploadAttachments(userId, newFiles);
      attachmentsToSave = [
        ...attachmentsToSave,
        ...uploadedFiles
      ];
    }
    
    return attachmentsToSave;
  };

  return {
    handleAttachments
  };
}
