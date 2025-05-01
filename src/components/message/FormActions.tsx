
import { useFormSubmission } from "@/hooks/useFormSubmission";

export function useFormActions() {
  const { handleSubmit, isFormValid } = useFormSubmission();
  
  return {
    handleSubmit,
    isFormValid
  };
}
