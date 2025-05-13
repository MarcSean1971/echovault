
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { createMessage } from "@/services/messages";
import { createMessageCondition } from "@/services/messages/conditionService";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useFormValidation } from "./useFormValidation";
import { simulateUploadProgress } from "@/utils/uploadProgress";
import { fetchRecipients } from "@/services/messages/recipientService";
import { TriggerType } from "@/types/message";
import { useTimeThresholdHandler } from "./message-edit/useTimeThresholdHandler";

export function useFormSubmission() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { isFormValid } = useFormValidation();
  const { processTimeThreshold } = useTimeThresholdHandler();
  
  const {
    title,
    setTitle,
    content,
    setContent,
    messageType,
    setMessageType,
    files,
    setFiles,
    setIsLoading,
    setShowUploadDialog,
    setUploadProgress,
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
    reminderMinutes,
    checkInCode
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
      
      // Create a condition (always required now)
      if (message) {
        try {
          // Fetch actual recipient data for the selected recipient IDs
          let recipients = [];
          if (selectedRecipients.length > 0) {
            const allRecipients = await fetchRecipients();
            recipients = allRecipients.filter(recipient => 
              selectedRecipients.includes(recipient.id)
            );
          }
          
          if (recipients.length === 0) {
            toast({
              title: "No recipients selected",
              description: "Please select at least one recipient for your message",
              variant: "destructive"
            });
            setIsLoading(false);
            setShowUploadDialog(false);
            return;
          }
          
          // Get the directly processed hours threshold - no special handling needed now
          const finalHoursThreshold = processTimeThreshold(hoursThreshold, minutesThreshold);
          
          // Create the message condition with all options
          await createMessageCondition(
            message.id,
            conditionType as TriggerType,
            {
              // Basic timing options
              hoursThreshold: finalHoursThreshold,
              minutesThreshold,
              triggerDate: triggerDate ? triggerDate.toISOString() : undefined,
              
              // Delivery pattern
              recurringPattern,
              
              // Security options
              pinCode: pinCode || undefined,
              unlockDelayHours: unlockDelay,
              expiryHours,
              
              // Reminders - values already in minutes
              reminderHours: reminderMinutes,
              
              // Panic trigger settings
              panicTriggerConfig,
              
              // Custom check-in code
              checkInCode: checkInCode || undefined,
              
              // Recipients - now using the actual recipient objects
              recipients
            }
          );
          
          toast({
            title: "Trigger configured",
            description: "Message trigger has been set up successfully"
          });
        } catch (error: any) {
          console.error("Error creating trigger condition:", error);
          toast({
            title: "Trigger setup failed",
            description: error.message || "Failed to set up the message trigger",
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Message saved",
        description: "Your message and trigger settings have been saved"
      });
      
      // Navigate back to messages list instead of dashboard
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
