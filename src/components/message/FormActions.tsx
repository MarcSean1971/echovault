import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createMessage } from "@/services/messages/messageService";
import { createMessageCondition } from "@/services/messages/conditionService";
import { fetchRecipients } from "@/services/messages/recipientService";
import { useMessageForm } from "./MessageFormContext";

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
    pinCode,
    unlockDelay,
    confirmationsRequired,
    setIsLoading,
    setShowUploadDialog,
    setUploadProgress
  } = useMessageForm();

  // This function gets full recipient objects from the selected IDs
  const fetchSelectedRecipients = async (ids: string[]) => {
    try {
      const allRecipients = await fetchRecipients();
      return allRecipients.filter(recipient => ids.includes(recipient.id));
    } catch (error) {
      console.error("Error fetching recipients:", error);
      return [];
    }
  };

  // This is just to simulate upload progress for UI feedback
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be signed in to create a message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    if (files.length > 0) {
      setShowUploadDialog(true);
      simulateUploadProgress();
    }

    try {
      // First, create the message
      const newMessage = await createMessage(
        userId,
        title,
        messageType === "text" ? content : null,
        messageType,
        files
      );
      
      // If dead man's switch is enabled, create the message condition
      if (enableDeadManSwitch && selectedRecipients.length > 0) {
        const selectedRecipientObjects = await fetchSelectedRecipients(selectedRecipients);
        
        // Prepare condition options based on the selected type
        const conditionOptions: any = {
          recipients: selectedRecipientObjects
        };
        
        // Set specific options based on condition type
        if (conditionType === 'no_check_in' || conditionType === 'regular_check_in') {
          conditionOptions.hoursThreshold = hoursThreshold;
        } 
        else if (conditionType === 'scheduled_date' && triggerDate) {
          conditionOptions.triggerDate = triggerDate.toISOString();
          conditionOptions.recurringPattern = recurringPattern;
        }
        else if (conditionType === 'group_confirmation') {
          conditionOptions.confirmationRequired = confirmationsRequired;
        }
        
        // Add advanced options if they are set
        if (pinCode) {
          conditionOptions.pinCode = pinCode;
        }
        
        if (unlockDelay > 0) {
          conditionOptions.unlockDelayHours = unlockDelay;
        }
        
        await createMessageCondition(
          newMessage.id,
          conditionType,
          conditionOptions
        );
      }
      
      toast({
        title: "Message created",
        description: enableDeadManSwitch 
          ? "Your message has been saved with dead man's switch enabled" 
          : "Your message has been saved securely"
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating message:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem creating your message",
        variant: "destructive"
      });
      setShowUploadDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isFormValid: (userId && 
      ((messageType === "text" && content) || messageType !== "text") &&
      (!enableDeadManSwitch || selectedRecipients.length > 0))
  };
}
