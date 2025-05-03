
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { FileAttachment } from "@/components/FileUploader";
import { MessageCondition, RecurringPattern, PanicTriggerConfig, TriggerType, DeliveryOption } from "@/types/message";

interface MessageFormContextProps {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  messageType: string;
  setMessageType: (type: string) => void;
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (recipients: string[]) => void;
  
  // Location fields
  shareLocation: boolean;
  setShareLocation: (share: boolean) => void;
  locationLatitude: number | null;
  setLocationLatitude: (lat: number | null) => void;
  locationLongitude: number | null;
  setLocationLongitude: (lng: number | null) => void;
  locationName: string;
  setLocationName: (name: string) => void;
  
  // Delivery options
  conditionType: TriggerType;
  setConditionType: (type: TriggerType) => void;
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  
  // Security options
  pinCode: string;
  setPinCode: (code: string) => void;
  unlockDelay: number;
  setUnlockDelay: (hours: number) => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  
  // Reminder options
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  
  // Panic trigger options
  panicTriggerConfig: PanicTriggerConfig | undefined;
  setPanicTriggerConfig: (config: PanicTriggerConfig) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
}

const MessageFormContext = createContext<MessageFormContextProps | undefined>(undefined);

export function MessageFormProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  // Location state
  const [shareLocation, setShareLocation] = useState(false);
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  
  // Delivery options
  const [conditionType, setConditionType] = useState<TriggerType>("no_check_in");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("once");
  const [hoursThreshold, setHoursThreshold] = useState(72);
  const [minutesThreshold, setMinutesThreshold] = useState(0);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | null>(null);
  const [triggerDate, setTriggerDate] = useState<Date | null>(null);
  
  // Security options
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [expiryHours, setExpiryHours] = useState(0);
  
  // Reminder options
  const [reminderHours, setReminderHours] = useState<number[]>([24]);
  
  // Panic trigger options
  const [panicTriggerConfig, setPanicTriggerConfig] = useState<PanicTriggerConfig | undefined>(undefined);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const value = {
    title, setTitle,
    content, setContent,
    messageType, setMessageType,
    files, setFiles,
    selectedRecipients, setSelectedRecipients,
    
    // Location fields
    shareLocation, setShareLocation,
    locationLatitude, setLocationLatitude,
    locationLongitude, setLocationLongitude,
    locationName, setLocationName,
    
    // Delivery options
    conditionType, setConditionType,
    deliveryOption, setDeliveryOption,
    hoursThreshold, setHoursThreshold,
    minutesThreshold, setMinutesThreshold,
    recurringPattern, setRecurringPattern,
    triggerDate, setTriggerDate,
    
    // Security options
    pinCode, setPinCode,
    unlockDelay, setUnlockDelay,
    expiryHours, setExpiryHours,
    
    // Reminder options
    reminderHours, setReminderHours,
    
    // Panic trigger options
    panicTriggerConfig, setPanicTriggerConfig,
    
    // Loading state
    isLoading, setIsLoading,
    showUploadDialog, setShowUploadDialog,
    uploadProgress, setUploadProgress
  };
  
  return (
    <MessageFormContext.Provider value={value}>
      {children}
    </MessageFormContext.Provider>
  );
}

export function useMessageForm() {
  const context = useContext(MessageFormContext);
  if (context === undefined) {
    throw new Error("useMessageForm must be used within a MessageFormProvider");
  }
  return context;
}
