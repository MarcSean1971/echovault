
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { createMessage } from "@/services/messages";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useFormValidation } from "./useFormValidation";
import { simulateUploadProgress } from "@/utils/uploadProgress";

export function useFormSubmission() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { isFormValid } = useFormValidation();
  
  const {
    title,
    content,
    messageType,
    files,
    setIsLoading,
    setShowUploadDialog,
    setUploadProgress,
  } = useMessageForm();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!isFormValid) {
      toast({
        title: "Please check your inputs",
        description: "Message title and content are required.",
        variant: "destructive"
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to save messages.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Show upload progress dialog if files exist
    if (files.length > 0) {
      setShowUploadDialog(true);
      simulateUploadProgress(setUploadProgress);
    }
    
    try {
      // Create the basic message
      const message = await createMessage(userId, title, content, messageType, files);
      
      toast({
        title: "Message saved",
        description: "Your message has been saved"
      });
      
      // Navigate back to messages list
      setTimeout(() => {
        navigate("/messages");
      }, 1500);
      
    } catch (error: any) {
      console.error("Error saving message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowUploadDialog(false);
      setUploadProgress(100);
    }
  };
  
  return {
    handleSubmit,
    isFormValid
  };
}
