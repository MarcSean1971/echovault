
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useFormValidation() {
  const {
    title,
    textContent,
    conditionType,
    hoursThreshold,
    minutesThreshold,
    selectedRecipients,
    recurringPattern,
    deliveryOption
  } = useMessageForm();

  const isFormValid = () => {
    // Basic validation
    if (title.trim() === "") return false;
    if (textContent.trim() === "") return false;
    
    // Trigger validation (always required now)
    // Make sure there's at least some threshold
    if (hoursThreshold <= 0 && minutesThreshold <= 0) return false;
    
    // For recurring delivery, make sure there's a pattern
    if (conditionType === 'no_check_in' && deliveryOption === 'recurring' && !recurringPattern) return false;
    
    // In a real implementation, we'd also validate recipients
    // if (selectedRecipients.length === 0) return false;
    
    return true;
  };

  return {
    isFormValid: isFormValid()
  };
}
