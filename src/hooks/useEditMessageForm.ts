
import { useState, useEffect } from "react";
import { Message, MessageCondition } from "@/types/message";
import { fetchMessageConditions } from "@/services/messages/conditionService";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useMessageFormLoader } from "./message-edit/useMessageFormLoader";
import { useRecipientSelection } from "./message-edit/useRecipientSelection";
import { useEditFormValidation } from "./message-edit/useEditFormValidation";

export function useEditMessageForm(message: Message, onCancel: () => void) {
  const { 
    isLoading, 
    showUploadDialog, 
    setShowUploadDialog, 
    uploadProgress,
    files,
    recurringPattern,
    setDeliveryOption
  } = useMessageForm();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [existingCondition, setExistingCondition] = useState<MessageCondition | null>(null);
  
  // Load message data into form
  useMessageFormLoader(message);
  
  // Manage recipient selection
  const { handleToggleRecipient, selectedRecipients } = useRecipientSelection();
  
  // Form validation
  const { isFormValid } = useEditFormValidation();
  
  // Load existing condition and set delivery option based on recurring pattern
  useEffect(() => {
    const loadExistingCondition = async () => {
      try {
        const conditions = await fetchMessageConditions(message.user_id);
        const condition = conditions.find(c => c.message_id === message.id);
        
        if (condition) {
          setExistingCondition(condition);
          
          // Set delivery option based on recurring_pattern
          if (condition.recurring_pattern) {
            console.log("Found recurring pattern, setting deliveryOption to recurring");
            setDeliveryOption("recurring");
          } else {
            console.log("No recurring pattern found, setting deliveryOption to once");
            setDeliveryOption("once");
          }
        }
      } catch (error) {
        console.error("Error loading existing condition:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadExistingCondition();
  }, [message.id, message.user_id, setDeliveryOption]);
  
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
