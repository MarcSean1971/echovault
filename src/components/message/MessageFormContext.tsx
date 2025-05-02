
import { createContext, useContext, ReactNode, useState } from "react";
import { FileAttachment } from "@/components/FileUploader";

interface MessageFormContextType {
  // Message Details
  title: string;
  setTitle: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  messageType: string;
  setMessageType: (value: string) => void;
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
  
  // Form state
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (value: number) => void;
  showUploadDialog: boolean;
  setShowUploadDialog: (value: boolean) => void;
}

export const MessageFormContext = createContext<MessageFormContextType | undefined>(undefined);

interface MessageFormProviderProps {
  children: ReactNode;
}

export function MessageFormProvider({ children }: MessageFormProviderProps) {
  // Message Details
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  
  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  const value = {
    title,
    setTitle,
    content,
    setContent,
    messageType,
    setMessageType,
    files,
    setFiles,
    isLoading,
    setIsLoading,
    uploadProgress,
    setUploadProgress,
    showUploadDialog,
    setShowUploadDialog
  };
  
  return (
    <MessageFormContext.Provider value={value}>
      {children}
    </MessageFormContext.Provider>
  );
}

export const useMessageForm = () => {
  const context = useContext(MessageFormContext);
  if (context === undefined) {
    throw new Error("useMessageForm must be used within a MessageFormProvider");
  }
  return context;
};
