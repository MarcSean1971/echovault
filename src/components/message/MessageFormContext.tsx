
import { createContext, useContext, ReactNode, useState } from "react";
import { FileAttachment } from "@/components/FileUploader";
import { 
  TriggerType, 
  RecurringPattern, 
  PanicTriggerConfig 
} from "@/types/message";

type DeliveryOption = "once" | "recurring" | "specific_date";

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
  // New: minutes threshold for custom time input
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (value: string[]) => void;
  triggerDate: Date | undefined;
  setTriggerDate: (value: Date | undefined) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (value: RecurringPattern | null) => void;
  
  // Delivery option for no_check_in
  deliveryOption: DeliveryOption;
  setDeliveryOption: (value: DeliveryOption) => void;
  
  // Secondary trigger options for combined triggers
  secondaryTriggerDate: Date | undefined;
  setSecondaryTriggerDate: (value: Date | undefined) => void;
  secondaryRecurringPattern: RecurringPattern | null;
  setSecondaryRecurringPattern: (value: RecurringPattern | null) => void;
  
  // Reminder settings
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
  
  // Panic trigger configuration
  panicTriggerConfig: PanicTriggerConfig;
  setPanicTriggerConfig: (value: PanicTriggerConfig) => void;
  
  // Advanced settings
  pinCode: string;
  setPinCode: (value: string) => void;
  unlockDelay: number;
  setUnlockDelay: (value: number) => void;
  confirmationsRequired: number;
  setConfirmationsRequired: (value: number) => void;
  expiryHours: number;
  setExpiryHours: (value: number) => void;
  
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
  const [minutesThreshold, setMinutesThreshold] = useState(0); // New: minutes threshold
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [triggerDate, setTriggerDate] = useState<Date | undefined>(undefined);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | null>(null);
  
  // Delivery option for no_check_in
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("once");
  
  // Secondary trigger options for combined triggers
  const [secondaryTriggerDate, setSecondaryTriggerDate] = useState<Date | undefined>(undefined);
  const [secondaryRecurringPattern, setSecondaryRecurringPattern] = useState<RecurringPattern | null>(null);
  
  // Reminder settings
  const [reminderHours, setReminderHours] = useState<number[]>([24]); // Default 24-hour reminder
  
  // Panic trigger configuration
  const [panicTriggerConfig, setPanicTriggerConfig] = useState<PanicTriggerConfig>({
    enabled: false,
    methods: ['app'],
    cancel_window_seconds: 10,
    bypass_logging: false
  });
  
  // Advanced settings
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [confirmationsRequired, setConfirmationsRequired] = useState(3);
  const [expiryHours, setExpiryHours] = useState(0); // 0 means no expiry
  
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
    minutesThreshold,
    setMinutesThreshold,
    selectedRecipients,
    setSelectedRecipients,
    triggerDate,
    setTriggerDate,
    recurringPattern,
    setRecurringPattern,
    deliveryOption,
    setDeliveryOption,
    secondaryTriggerDate,
    setSecondaryTriggerDate,
    secondaryRecurringPattern,
    setSecondaryRecurringPattern,
    reminderHours,
    setReminderHours,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    confirmationsRequired,
    setConfirmationsRequired,
    expiryHours,
    setExpiryHours,
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
