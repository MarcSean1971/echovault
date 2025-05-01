
import { createContext, useContext, ReactNode, useState } from "react";
import { FileAttachment } from "@/components/FileUploader";
import { TriggerType, RecurringPattern } from "@/types/message";

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
  
  // Dead Man's Switch
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (value: boolean) => void;
  conditionType: TriggerType;
  setConditionType: (value: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (value: string[]) => void;
  triggerDate: Date | undefined;
  setTriggerDate: (value: Date | undefined) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (value: RecurringPattern | null) => void;
  
  // Advanced settings
  pinCode: string;
  setPinCode: (value: string) => void;
  unlockDelay: number;
  setUnlockDelay: (value: number) => void;
  confirmationsRequired: number;
  setConfirmationsRequired: (value: number) => void;
  
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
  
  // Dead Man's Switch
  const [enableDeadManSwitch, setEnableDeadManSwitch] = useState(false);
  const [conditionType, setConditionType] = useState<TriggerType>('no_check_in');
  const [hoursThreshold, setHoursThreshold] = useState(72);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [triggerDate, setTriggerDate] = useState<Date | undefined>(undefined);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | null>(null);
  
  // Advanced settings
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [confirmationsRequired, setConfirmationsRequired] = useState(3);
  
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
    enableDeadManSwitch,
    setEnableDeadManSwitch,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    selectedRecipients,
    setSelectedRecipients,
    triggerDate,
    setTriggerDate,
    recurringPattern,
    setRecurringPattern,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    confirmationsRequired,
    setConfirmationsRequired,
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
