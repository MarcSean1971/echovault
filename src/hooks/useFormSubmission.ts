
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { createMessage } from "@/services/messages";
import { createMessageCondition } from "@/services/messages/conditionService";
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
    enableDeadManSwitch,
    conditionType,
    hoursThreshold,
    minutesThreshold,
    selectedRecipients,
    triggerDate,
    recurringPattern,
    panicTriggerConfig,
    pinCode,
    unlockDelay,
    expiryHours,
    deliveryOption,
    reminderHours
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
      
      // Create a condition if Dead Man's Switch is enabled
      if (enableDeadManSwitch && message) {
        try {
          // Mock recipients for now - in a real implementation, these would come from the form
          const mockRecipients = [
            {
              id: "mock-id-1",
              name: "Test Recipient",
              email: "test@example.com"
            }
          ];
          
          await createMessageCondition(
            message.id,
            conditionType,
            {
              hoursThreshold,
              // Using recurring pattern for all time-based scheduling now
              recurringPattern,
              recipients: mockRecipients,
              pinCode: pinCode || undefined,
              unlockDelayHours: unlockDelay,
              expiryHours,
              reminderHours
            }
          );
          
          toast({
            title: "Trigger configured",
            description: "Dead Man's Switch has been set up successfully"
          });
        } catch (error: any) {
          console.error("Error creating trigger condition:", error);
          toast({
            title: "Trigger setup failed",
            description: error.message || "Failed to set up the Dead Man's Switch",
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Message saved",
        description: enableDeadManSwitch ? 
          "Your message and trigger settings have been saved" : 
          "Your message has been saved"
      });
      
      // Navigate back to messages list
      setTimeout(() => {
        navigate("/dashboard");
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
