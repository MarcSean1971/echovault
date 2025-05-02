
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { createMessage } from "@/services/messages";
import { createMessageCondition } from "@/services/messages/conditionService";
import { useMessageForm } from "./MessageFormContext";
import { simulateUploadProgress } from "@/utils/uploadProgress";
import { fetchRecipients } from "@/services/messages/recipientService";

export function useFormActions() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const {
    title,
    content,
    messageType,
    files,
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
    reminderHours
  } = useMessageForm();

  // Check if the form has valid required inputs
  const isFormValid = 
    title.trim() !== "" && 
    (messageType !== "text" || content.trim() !== "") &&
    selectedRecipients.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!isFormValid) {
      toast({
        title: "Please check your inputs",
        description: "Message title, content, and at least one recipient are required.",
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
            
            if (recipients.length === 0) {
              throw new Error("No valid recipients found. Please check your recipient selection.");
            }
          } else {
            throw new Error("Please select at least one recipient.");
          }
          
          await createMessageCondition(
            message.id,
            conditionType,
            {
              // Basic timing options
              hoursThreshold,
              minutesThreshold,
              triggerDate: triggerDate ? triggerDate.toISOString() : undefined,
              
              // Delivery pattern
              recurringPattern,
              
              // Security options
              pinCode: pinCode || undefined,
              unlockDelayHours: unlockDelay,
              expiryHours,
              
              // Reminders
              reminderHours,
              
              // Panic trigger settings
              panicTriggerConfig,
              
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
