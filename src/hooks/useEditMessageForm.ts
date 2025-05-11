
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachments } from "@/services/messages/fileService";
import { fetchRecipients } from "@/services/messages/recipientService";
import { Message, MessageCondition, Recipient, TriggerType } from "@/types/message";
import { 
  fetchMessageConditions, 
  updateMessageCondition,
  createMessageCondition 
} from "@/services/messages/conditionService";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useEditMessageForm(message: Message, onCancel: () => void) {
  const { 
    isLoading, 
    setIsLoading,
    files, 
    setFiles,
    title,
    setTitle,
    content,
    setContent,
    messageType,
    setMessageType,
    textContent,
    setTextContent,
    videoContent,
    setVideoContent,
    showUploadDialog, 
    setShowUploadDialog, 
    uploadProgress,
    selectedRecipients,
    setSelectedRecipients,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold,
    setMinutesThreshold,
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
    deliveryOption,
    setDeliveryOption,
    reminderHours,
    setReminderHours,
    checkInCode,
    setCheckInCode
  } = useMessageForm();
  
  const navigate = useNavigate();
  const [existingCondition, setExistingCondition] = useState<MessageCondition | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // Load message condition data
  useEffect(() => {
    const loadMessageCondition = async () => {
      try {
        // Fetch message conditions
        const conditions = await fetchMessageConditions(message.user_id);
        const messageCondition = conditions.find(c => c.message_id === message.id);
        
        if (messageCondition) {
          setExistingCondition(messageCondition);
          
          // Populate form with condition data
          if (messageCondition.condition_type) {
            setConditionType(messageCondition.condition_type as TriggerType);
          }
          setHoursThreshold(messageCondition.hours_threshold);
          setMinutesThreshold(messageCondition.minutes_threshold || 0);
          
          // Set recipients if they exist
          if (messageCondition.recipients && messageCondition.recipients.length > 0) {
            setRecipients(messageCondition.recipients);
            setSelectedRecipients(messageCondition.recipients.map(r => r.id));
          }
          
          // Set recurring pattern if it exists
          if (messageCondition.recurring_pattern) {
            setRecurringPattern(messageCondition.recurring_pattern);
          }
          
          // Set trigger date if it exists
          if (messageCondition.trigger_date) {
            setTriggerDate(new Date(messageCondition.trigger_date));
          }
          
          // Set panic trigger config if it exists
          if (messageCondition.panic_trigger_config) {
            console.log("Loading panic trigger config:", messageCondition.panic_trigger_config);
            setPanicTriggerConfig(messageCondition.panic_trigger_config);
          } else if (messageCondition.panic_config) {
            // Fallback to panic_config if panic_trigger_config doesn't exist
            console.log("Loading panic config:", messageCondition.panic_config);
            setPanicTriggerConfig(messageCondition.panic_config);
          }
          
          // Set security options if they exist
          if (messageCondition.pin_code) {
            setPinCode(messageCondition.pin_code);
          }
          
          if (messageCondition.unlock_delay_hours) {
            setUnlockDelay(messageCondition.unlock_delay_hours);
          }
          
          if (messageCondition.expiry_hours) {
            setExpiryHours(messageCondition.expiry_hours);
          }
          
          // Set delivery option based on condition
          if (messageCondition.recurring_pattern) {
            setDeliveryOption("recurring");
          } else if (messageCondition.trigger_date) {
            setDeliveryOption("scheduled");
          } else {
            setDeliveryOption("once");
          }
          
          // Set reminder hours if they exist
          if (messageCondition.reminder_hours && messageCondition.reminder_hours.length > 0) {
            setReminderHours(messageCondition.reminder_hours);
          }
          
          // Set custom check-in code if it exists
          if (messageCondition.check_in_code) {
            setCheckInCode(messageCondition.check_in_code);
          }
        }
        
        // Load all recipients for selection
        const allRecipients = await fetchRecipients();
        setRecipients(allRecipients);
      } catch (error) {
        console.error("Error loading message condition:", error);
        toast({
          title: "Error",
          description: "Failed to load message settings",
          variant: "destructive"
        });
      } finally {
        setInitialLoading(false);
      }
    };
    
    // Populate the form with current message data
    setTitle(message.title);
    setContent(message.content || "");
    setMessageType(message.message_type);
    
    // If there are attachments, set them
    if (message.attachments && Array.isArray(message.attachments)) {
      setFiles(message.attachments.map(att => ({
        file: null,
        name: att.name,
        size: att.size,
        type: att.type,
        path: att.path,
        isUploaded: true
      })));
    }
    
    loadMessageCondition();
  }, [message, setTitle, setContent, setMessageType, setFiles, setConditionType, setHoursThreshold, 
      setMinutesThreshold, setSelectedRecipients, setRecipients, setRecurringPattern, setTriggerDate, 
      setPanicTriggerConfig, setPinCode, setUnlockDelay, setExpiryHours, setDeliveryOption, 
      setReminderHours, setCheckInCode]);

  // Toggle function for recipients
  const handleToggleRecipient = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  const isFormValid = title.trim() !== "" && 
    (messageType !== "text" || content.trim() !== "") &&
    selectedRecipients.length > 0;
  
  return {
    isLoading,
    initialLoading,
    showUploadDialog,
    setShowUploadDialog,
    uploadProgress,
    files,
    selectedRecipients,
    handleToggleRecipient,
    isFormValid,
    existingCondition
  };
}
