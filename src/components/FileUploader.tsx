
import { useState } from "react";
import { Upload, X, File as FileIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAttachmentAccess } from "@/hooks/useAttachmentAccess";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export interface FileAttachment {
  file: File | null;
  id?: string;
  url?: string;
  type?: string;
  name: string;
  size: number;
  uploading?: boolean;
  progress?: number;
  path?: string;
  isUploaded?: boolean;
}

interface FileUploaderProps {
  files: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function FileUploader({
  files,
  onChange,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<FileAttachment | null>(null);

  // Setup file access hook at component level
  const { openFile } = useAttachmentAccess({
    filePath: currentFile?.path || '',
    fileName: currentFile?.name || '',
    fileType: currentFile?.type || '',
    fileSize: currentFile?.size || 0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles = newFiles.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    const newAttachments: FileAttachment[] = validFiles.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    onChange([...files, ...newAttachments]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleViewFile = async (file: FileAttachment, index: number) => {
    // Only handle files that have been uploaded (have a path)
    if (!file.path) return;
    
    // Set the current file and mark it as viewing
    setCurrentFile(file);
    setViewingFile(file.path);
    
    try {
      // Use the pre-initialized openFile function from the hook
      const result = await openFile();
      
      if (!result) {
        toast({
          title: "Error",
          description: "Unable to open the file for preview",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error viewing file:", error);
      toast({
        title: "Error",
        description: "Failed to preview the file",
        variant: "destructive"
      });
    } finally {
      setViewingFile(null);
      setCurrentFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 ${
          isDragging ? "border-primary" : "border-dashed"
        } rounded-md p-6 text-center`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
            <p>
              Drag and drop your files here, or{" "}
              <label className="text-primary cursor-pointer hover:underline">
                browse
                <Input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  disabled={disabled}
                />
              </label>
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum file size: {maxSize}MB (up to {maxFiles} files)
            </p>
          </div>
        ) : (
          <div className="text-center">
            <label className="text-primary cursor-pointer hover:underline">
              Add more files
              <Input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                multiple
                disabled={disabled || files.length >= maxFiles}
              />
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              {files.length} of {maxFiles} files added
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Files to upload:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md bg-background"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileIcon className="h-6 w-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {attachment.uploading && typeof attachment.progress === "number" && (
                    <Progress value={attachment.progress} className="w-20 h-2" />
                  )}
                  
                  {/* View button - only show for uploaded files */}
                  {(attachment.path || attachment.isUploaded) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFile(attachment, index)}
                      disabled={disabled || attachment.uploading || viewingFile === attachment.path}
                      className={`text-blue-500 hover:text-blue-700 ${HOVER_TRANSITION}`}
                    >
                      {viewingFile === attachment.path ? (
                        <Spinner size="sm" className="text-blue-500" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={disabled || attachment.uploading}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
