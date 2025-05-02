
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useFormValidation() {
  const {
    title,
    content,
    messageType,
    enableDeadManSwitch,
    selectedRecipients,
    conditionType,
    triggerDate,
    recurringPattern,
    deliveryOption
  } = useMessageForm();

  const isFormValid = () => {
    // Basic validation
    if (title.trim() === "") return false;
    if (messageType === "text" && content.trim() === "") return false;
    
    // Validate recipients
    if (enableDeadManSwitch && selectedRecipients.length === 0) return false;
    
    // Validate delivery options
    if (conditionType === 'no_check_in') {
      if (deliveryOption === 'specific_date' && !triggerDate) return false;
      if (deliveryOption === 'recurring' && !recurringPattern) return false;
    }
    
    // Validate combined trigger
    if (conditionType === 'inactivity_to_date' && !triggerDate) return false;
    
    return true;
  };

  return {
    isFormValid: isFormValid()
  };
}
