
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
    enableDeadManSwitch,
    conditionType,
    hoursThreshold,
    minutesThreshold,
    selectedRecipients,
    triggerDate,
    recurringPattern,
    reminderHours,
    panicTriggerConfig,
    pinCode,
    unlockDelay,
    expiryHours,
    setIsLoading,
    setShowUploadDialog,
    setUploadProgress,
    deliveryOption,
  } = useMessageForm();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!isFormValid) {
      toast({
        title: "Please check your inputs",
        description: "Message title, content, and recipients are required.",
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
      // Create the base message first
      const message = await createMessage(userId, title, content, messageType, files);
      
      if (enableDeadManSwitch) {
        // If dead man's switch is enabled, create the condition
        const recipients = selectedRecipients.map(id => {
          // In a real app, this would likely come from a recipients database
          // Here we're just creating placeholder recipient objects
          return {
            id: id,
            name: `Recipient ${id}`,
            email: `recipient-${id}@example.com`
          };
        });
        
        // Calculate total hours including minutes
        const totalHoursThreshold = hoursThreshold + (minutesThreshold / 60);
        
        const conditionOptions = {
          hoursThreshold: totalHoursThreshold,
          recipients,
          pinCode: pinCode || undefined,
          unlockDelayHours: unlockDelay || undefined,
          expiryHours: expiryHours || undefined,
          reminderHours: reminderHours || [24]  // Default to 24-hour reminder
        };

        // Handle different delivery options for no_check_in
        if (conditionType === 'no_check_in') {
          // For recurring delivery
          if (deliveryOption === 'recurring' && recurringPattern) {
            Object.assign(conditionOptions, { recurringPattern });
          }
          
          // For specific date delivery
          if (deliveryOption === 'specific_date' && triggerDate) {
            Object.assign(conditionOptions, {
              triggerDate: triggerDate.toISOString(),
              recurringPattern
            });
          }
        }
        
        // Handle regular check-in with recurring messages
        else if (conditionType === 'regular_check_in_recurring' && recurringPattern) {
          Object.assign(conditionOptions, {
            recurringPattern,
          });
        }
        
        // Handle combined inactivity_to_date condition
        else if (conditionType === 'inactivity_to_date' && triggerDate) {
          Object.assign(conditionOptions, {
            triggerDate: triggerDate.toISOString(),
            recurringPattern
          });
        }
        
        // Add panic trigger configuration
        else if (conditionType === 'panic_trigger') {
          Object.assign(conditionOptions, {
            panicTriggerConfig
          });
        }
        
        // Create the condition
        await createMessageCondition(message.id, conditionType, conditionOptions);
      }
      
      toast({
        title: "Message saved",
        description: enableDeadManSwitch 
          ? "Your message and trigger settings have been saved"
          : "Your message has been saved"
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
