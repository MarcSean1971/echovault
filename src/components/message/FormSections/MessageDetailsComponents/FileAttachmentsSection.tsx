
import { Label } from "@/components/ui/label";
import { FileAttachment } from "@/types/message";

interface FileUploaderProps {
  files: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
}

// Simplified FileUploader component
export function FileUploader({ files, onChange }: FileUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles: FileAttachment[] = Array.from(e.target.files).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    } as FileAttachment));
    
    onChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="space-y-2">
      <input 
        type="file"
        multiple
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
      />
      
      {files.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-1">Selected Files:</p>
          <ul className="text-sm space-y-1">
            {files.map((file, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <span>{file.name}</span>
                <button 
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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
