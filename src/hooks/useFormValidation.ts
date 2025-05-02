
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useFormValidation() {
  const {
    title,
    content,
    messageType,
    enableDeadManSwitch,
    conditionType,
    hoursThreshold,
    minutesThreshold,
    selectedRecipients,
    triggerDate,
    deliveryOption
  } = useMessageForm();

  const isFormValid = () => {
    // Basic validation
    if (title.trim() === "") return false;
    if (messageType === "text" && content.trim() === "") return false;
    
    // Dead Man's Switch validation
    if (enableDeadManSwitch) {
      // Make sure there's at least some threshold
      if (hoursThreshold <= 0 && minutesThreshold <= 0) return false;
      
      // For specific date delivery, make sure there's a date
      if (conditionType === 'no_check_in' && deliveryOption === 'specific_date' && !triggerDate) return false;
      
      // In a real implementation, we'd also validate recipients
      // if (selectedRecipients.length === 0) return false;
    }
    
    return true;
  };

  return {
    isFormValid: isFormValid()
  };
}
