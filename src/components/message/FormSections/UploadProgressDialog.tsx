
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileAttachment } from "@/components/FileUploader";

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
        <DialogHeader>
          <DialogTitle>Uploading Files</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Uploading {files.length} file{files.length > 1 ? 's' : ''}...
            </p>
          </div>
        </div>
        <DialogFooter>
          {uploadProgress === 100 && !isLoading && (
            <p className="text-sm text-green-500">Upload complete! Saving message...</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
