
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useEditFormValidation() {
  const { title, content, messageType, selectedRecipients } = useMessageForm();

  const isFormValid = title.trim() !== "" && 
    (messageType !== "text" || content.trim() !== "") &&
    selectedRecipients.length > 0;
  
  return { isFormValid };
}
