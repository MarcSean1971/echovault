
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useFormValidation() {
  const {
    title,
    content,
    messageType
  } = useMessageForm();

  const isFormValid = () => {
    // Basic validation
    if (title.trim() === "") return false;
    if (messageType === "text" && content.trim() === "") return false;
    
    return true;
  };

  return {
    isFormValid: isFormValid()
  };
}
