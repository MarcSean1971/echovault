
import React, { createContext, useContext, useState } from "react";
import { FileAttachment } from "../FileUploader";
import { Recipient, TriggerType, DeliveryOption, RecurringPattern, PanicTriggerConfig } from "@/types/message";

interface MessageFormContextType {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  textContent: string;
  setTextContent: (content: string) => void;
  videoContent: string;
  setVideoContent: (content: string) => void;
  messageType: string;
  setMessageType: (type: string) => void;
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (recipients: string[]) => void;
  conditionType: TriggerType;
  setConditionType: (type: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  panicTriggerConfig: PanicTriggerConfig | undefined;
  setPanicTriggerConfig: (config: PanicTriggerConfig) => void;
  pinCode: string;
  setPinCode: (code: string) => void;
  unlockDelay: number;
  setUnlockDelay: (hours: number) => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  reminderMinutes: number[]; // Renamed from reminderHours to reminderMinutes
  setReminderMinutes: (minutes: number[]) => void; // Updated parameter name
  checkInCode: string;
  setCheckInCode: (code: string) => void;
  // Location-related fields
  shareLocation: boolean;
  setShareLocation: (share: boolean) => void;
  locationName: string | null;
  setLocationName: (name: string | null) => void;
  locationLatitude: number | null;
  setLocationLatitude: (lat: number | null) => void;
  locationLongitude: number | null;
  setLocationLongitude: (lng: number | null) => void;
}

const MessageFormContext = createContext<MessageFormContextType | undefined>(undefined);

export const MessageFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [videoContent, setVideoContent] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  // Trigger condition states
  const [conditionType, setConditionType] = useState<TriggerType>("no_check_in");
  const [hoursThreshold, setHoursThreshold] = useState(72); // Default 72 hours
  const [minutesThreshold, setMinutesThreshold] = useState(0);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("once");
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | null>(null);
  const [triggerDate, setTriggerDate] = useState<Date | null>(null);
  
  // Panic trigger config
  const [panicTriggerConfig, setPanicTriggerConfig] = useState<PanicTriggerConfig>();
  
  // Security options
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [expiryHours, setExpiryHours] = useState(0);
  
  // CRITICAL FIX: Default reminder - initialize as an empty array instead of with a default value
  // This ensures we don't override values loaded from the database during initialization
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([]);
  
  // Custom check-in code
  const [checkInCode, setCheckInCode] = useState("");
  
  // Location-related states
  const [shareLocation, setShareLocation] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);

  const value = {
    title,
    setTitle,
    content,
    setContent,
    textContent,
    setTextContent,
    videoContent,
    setVideoContent,
    messageType,
    setMessageType,
    files,
    setFiles,
    isLoading,
    setIsLoading,
    showUploadDialog,
    setShowUploadDialog,
    uploadProgress,
    setUploadProgress,
    selectedRecipients,
    setSelectedRecipients,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold,
    setMinutesThreshold,
    deliveryOption,
    setDeliveryOption,
    recurringPattern,
    setRecurringPattern,
    triggerDate,
    setTriggerDate,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    reminderMinutes,
    setReminderMinutes,
    checkInCode,
    setCheckInCode,
    // Add location-related values to the context
    shareLocation,
    setShareLocation,
    locationName,
    setLocationName,
    locationLatitude,
    setLocationLatitude,
    locationLongitude,
    setLocationLongitude
  };

  return (
    <MessageFormContext.Provider value={value}>
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
