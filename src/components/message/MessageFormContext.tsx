
import React, { createContext, useContext, useState } from "react";
import { MessageType, TriggerType, DeliveryOption, RecurringPattern, PanicTriggerConfig, FileAttachment } from "@/types/message";

export interface MessageFormContextType {
  // Message content
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  textContent: string;
  setTextContent: (content: string) => void;
  messageType: MessageType;
  setMessageType: (type: MessageType) => void;
  
  // Video and audio content
  videoContent: string;
  setVideoContent: (content: string) => void;
  audioContent: string;
  setAudioContent: (content: string) => void;
  
  // File attachments
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  
  // Trigger conditions
  conditionType: TriggerType;
  setConditionType: (type: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  
  // Recipients
  selectedRecipients: string[];
  setSelectedRecipients: (recipients: string[]) => void;
  
  // Scheduled date
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  
  // Recurring pattern
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  
  // Panic trigger config
  panicTriggerConfig: PanicTriggerConfig | undefined;
  setPanicTriggerConfig: (config: PanicTriggerConfig) => void;
  
  // Security options
  pinCode: string;
  setPinCode: (code: string) => void;
  unlockDelay: number;
  setUnlockDelay: (hours: number) => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  
  // Delivery options
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  
  // Reminder settings
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  
  // Location data
  shareLocation: boolean;
  setShareLocation: (share: boolean) => void;
  locationLatitude: number | null;
  setLocationLatitude: (lat: number | null) => void;
  locationLongitude: number | null;
  setLocationLongitude: (lng: number | null) => void;
  locationName: string;
  setLocationName: (name: string) => void;
  
  // Check-in code
  checkInCode: string;
  setCheckInCode: (code: string) => void;
}

const MessageFormContext = createContext<MessageFormContextType | undefined>(undefined);

export function MessageFormProvider({ children }: { children: React.ReactNode }) {
  // Message content state
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [videoContent, setVideoContent] = useState<string>("");
  const [audioContent, setAudioContent] = useState<string>("");
  
  // File attachments
  const [files, setFiles] = useState<FileAttachment[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Trigger conditions
  const [conditionType, setConditionType] = useState<TriggerType>("no_check_in");
  const [hoursThreshold, setHoursThreshold] = useState<number>(24);
  const [minutesThreshold, setMinutesThreshold] = useState<number>(0);
  
  // Recipients
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  // Scheduled date
  const [triggerDate, setTriggerDate] = useState<Date | null>(null);
  
  // Recurring pattern
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | null>(null);
  
  // Panic trigger config
  const [panicTriggerConfig, setPanicTriggerConfig] = useState<PanicTriggerConfig | undefined>(undefined);
  
  // Security options
  const [pinCode, setPinCode] = useState<string>("");
  const [unlockDelay, setUnlockDelay] = useState<number>(0);
  const [expiryHours, setExpiryHours] = useState<number>(72);
  
  // Delivery options
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("once");
  
  // Reminder settings
  const [reminderHours, setReminderHours] = useState<number[]>([24]);
  
  // Location data
  const [shareLocation, setShareLocation] = useState<boolean>(false);
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  
  // Check-in code
  const [checkInCode, setCheckInCode] = useState<string>("");

  const value = {
    title,
    setTitle,
    content,
    setContent,
    textContent,
    setTextContent,
    messageType,
    setMessageType,
    videoContent,
    setVideoContent,
    audioContent,
    setAudioContent,
    files,
    setFiles,
    isLoading,
    setIsLoading,
    showUploadDialog,
    setShowUploadDialog,
    uploadProgress,
    setUploadProgress,
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
    setReminderHours,
    shareLocation,
    setShareLocation,
    locationLatitude,
    setLocationLatitude,
    locationLongitude,
    setLocationLongitude,
    locationName,
    setLocationName,
    checkInCode,
    setCheckInCode
  };

  return <MessageFormContext.Provider value={value}>{children}</MessageFormContext.Provider>;
}

export function useMessageForm() {
  const context = useContext(MessageFormContext);
  if (context === undefined) {
    throw new Error("useMessageForm must be used within a MessageFormProvider");
  }
  return context;
}
