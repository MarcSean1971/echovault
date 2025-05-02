
import { createContext, useContext, ReactNode, useState } from "react";
import { FileAttachment } from "@/components/FileUploader";
import { RecurringPattern, TriggerType, DeliveryOption, PanicTriggerConfig } from "@/types/message";

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

  // Dead Man's Switch properties
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (value: boolean) => void;
  conditionType: TriggerType;
  setConditionType: (value: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (value: string[]) => void;
  triggerDate: Date | null;
  setTriggerDate: (value: Date | null) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (value: RecurringPattern | null) => void;
  panicTriggerConfig: PanicTriggerConfig;
  setPanicTriggerConfig: (value: PanicTriggerConfig) => void;
  pinCode: string;
  setPinCode: (value: string) => void;
  unlockDelay: number;
  setUnlockDelay: (value: number) => void;
  expiryHours: number;
  setExpiryHours: (value: number) => void;
  deliveryOption: DeliveryOption;
  setDeliveryOption: (value: DeliveryOption) => void;
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
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

  // Dead Man's Switch properties
  const [enableDeadManSwitch, setEnableDeadManSwitch] = useState(false);
  const [conditionType, setConditionType] = useState<TriggerType>("no_check_in");
  const [hoursThreshold, setHoursThreshold] = useState(24);
  const [minutesThreshold, setMinutesThreshold] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [triggerDate, setTriggerDate] = useState<Date | null>(null);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | null>(null);
  const [panicTriggerConfig, setPanicTriggerConfig] = useState<PanicTriggerConfig>({
    enabled: true,
    methods: ['app'],
    cancel_window_seconds: 10,
    bypass_logging: false
  });
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [expiryHours, setExpiryHours] = useState(24);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("once");
  const [reminderHours, setReminderHours] = useState<number[]>([12, 6, 1]);
  
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
    setShowUploadDialog,
    enableDeadManSwitch,
    setEnableDeadManSwitch,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold,
    setMinutesThreshold,
    selectedRecipients,
    setSelectedRecipients,
    triggerDate,
    setTriggerDate,
    recurringPattern,
    setRecurringPattern,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    deliveryOption,
    setDeliveryOption,
    reminderHours,
    setReminderHours
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
