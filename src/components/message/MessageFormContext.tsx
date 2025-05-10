
import { createContext, useContext, useState } from "react";
import { TriggerType, DeliveryOption, RecurringPattern, FileAttachment } from "@/types/message";

type MessageType = "text";

interface MessageFormContextType {
  // Basic message properties
  messageType: MessageType;
  content: string;
  textContent: string;
  title: string;
  
  // Message form state setters
  setMessageType: (messageType: MessageType) => void;
  setContent: (content: string) => void;
  setTextContent: (content: string) => void;
  setTitle: (title: string) => void;
  
  // File handling
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  
  // Recipients
  selectedRecipients: string[];
  setSelectedRecipients: (recipients: string[]) => void;
  
  // Dead Man Switch properties
  conditionType: TriggerType;
  setConditionType: (type: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  recurringPattern: RecurringPattern;
  setRecurringPattern: (pattern: RecurringPattern) => void;
  panicTriggerConfig: any | null;
  setPanicTriggerConfig: (config: any | null) => void;
  pinCode: string;
  setPinCode: (code: string) => void;
  unlockDelay: number;
  setUnlockDelay: (hours: number) => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  checkInCode: string;
  setCheckInCode: (code: string) => void;
  
  // Location
  shareLocation: boolean;
  setShareLocation: (share: boolean) => void;
  locationLatitude: number | null;
  setLocationLatitude: (lat: number | null) => void;
  locationLongitude: number | null;
  setLocationLongitude: (lng: number | null) => void;
  locationName: string;
  setLocationName: (name: string) => void;
}

const MessageFormContext = createContext<MessageFormContextType | undefined>(undefined);

export const MessageFormProvider = ({ children }: { children: React.ReactNode }) => {
  // Basic message properties
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [content, setContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [title, setTitle] = useState("");
  
  // File handling
  const [files, setFiles] = useState<FileAttachment[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Recipients
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  // Dead Man Switch properties
  const [conditionType, setConditionType] = useState<TriggerType>("no_check_in");
  const [hoursThreshold, setHoursThreshold] = useState(24);
  const [minutesThreshold, setMinutesThreshold] = useState(0);
  const [triggerDate, setTriggerDate] = useState<Date | null>(null);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>(null);
  const [panicTriggerConfig, setPanicTriggerConfig] = useState<any | null>(null);
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [expiryHours, setExpiryHours] = useState(0);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("immediate");
  const [reminderHours, setReminderHours] = useState<number[]>([]);
  const [checkInCode, setCheckInCode] = useState("");
  
  // Location
  const [shareLocation, setShareLocation] = useState(false);
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");

  return (
    <MessageFormContext.Provider
      value={{
        // Basic message properties
        messageType,
        content,
        textContent,
        title,
        setMessageType,
        setContent,
        setTextContent,
        setTitle,
        
        // File handling
        files,
        setFiles,
        
        // UI state
        isLoading,
        setIsLoading,
        showUploadDialog,
        setShowUploadDialog,
        uploadProgress,
        setUploadProgress,
        
        // Recipients
        selectedRecipients,
        setSelectedRecipients,
        
        // Dead Man Switch properties
        conditionType,
        setConditionType,
        hoursThreshold,
        setHoursThreshold,
        minutesThreshold,
        setMinutesThreshold,
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
        setReminderHours,
        checkInCode,
        setCheckInCode,
        
        // Location
        shareLocation,
        setShareLocation,
        locationLatitude,
        setLocationLatitude,
        locationLongitude,
        setLocationLongitude,
        locationName,
        setLocationName,
      }}
    >
      {children}
    </MessageFormContext.Provider>
  );
};

export const useMessageForm = () => {
  const context = useContext(MessageFormContext);
  if (context === undefined) {
    throw new Error("useMessageForm must be used within a MessageFormProvider");
  }
  return context;
};
