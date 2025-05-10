
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FileAttachment } from "@/types/message";
import { FileCheck, FileX } from "lucide-react";

interface UploadProgressDialogProps {
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploadProgress: number;
  files: FileAttachment[];
  isLoading: boolean;
}

export function UploadProgressDialog({
  showUploadDialog,
  setShowUploadDialog,
  uploadProgress,
  files,
  isLoading
}: UploadProgressDialogProps) {
  return (
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Uploading Files</h3>
          
          <Progress value={uploadProgress} className="h-2" />
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((file) => (
              <div 
                key={file.name} 
                className="flex items-center justify-between py-1 px-2 border rounded"
              >
                <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%]">
                  {file.name}
                </div>
                <div className="flex-shrink-0">
                  {uploadProgress >= 100 ? (
                    <FileCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-center text-muted-foreground">
            {isLoading && uploadProgress >= 100 ? (
              "Processing message and files..."
            ) : (
              `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}...`
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
