
import { toast } from "@/components/ui/use-toast";
import { createMessage } from "@/services/messages";
import { createMessageCondition } from "@/services/messages/conditionService";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageForm } from "./MessageFormContext";
import { useNavigate } from "react-router-dom";
import { TriggerType } from "@/types/message";

export function useFormActions() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const {
    title,
    content,
    messageType,
    files,
    enableDeadManSwitch,
    conditionType,
    hoursThreshold,
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
  } = useMessageForm();

  const isFormValid = () => {
    // Basic validation
    if (title.trim() === "") return false;
    if (messageType === "text" && content.trim() === "") return false;
    
    // Validate recipients
    if (enableDeadManSwitch && selectedRecipients.length === 0) return false;
    
    return true;
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    let progressValue = 0;
    
    const interval = setInterval(() => {
      progressValue += 5;
      
      if (progressValue >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
      } else {
        setUploadProgress(progressValue);
      }
    }, 200);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!isFormValid()) {
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
      simulateUploadProgress();
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
        
        const conditionOptions = {
          hoursThreshold,
          recipients,
          pinCode: pinCode || undefined,
          unlockDelayHours: unlockDelay || undefined,
          expiryHours: expiryHours || undefined,
          reminderHours: reminderHours || [24]  // Default to 24-hour reminder
        };

        // Add date-specific options if needed
        if (conditionType === 'scheduled_date' && triggerDate) {
          Object.assign(conditionOptions, {
            triggerDate: triggerDate.toISOString(),
            recurringPattern
          });
        }
        
        // Add panic trigger configuration
        if (conditionType === 'panic_trigger') {
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
    isFormValid: isFormValid()
  };
}
