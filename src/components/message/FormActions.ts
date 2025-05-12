
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { createMessage } from "@/services/messages";
import { createMessageCondition } from "@/services/messages/conditionService";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { simulateUploadProgress } from "@/utils/uploadProgress";
import { fetchRecipients } from "@/services/messages/recipientService";
import { TriggerType } from "@/types/message";

export function useFormActions() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const {
    title,
    content,
    textContent,
    videoContent,
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
    reminderMinutes,
    // Location fields
    shareLocation,
    locationLatitude,
    locationLongitude,
    locationName,
    checkInCode
  } = useMessageForm();

  // Check if the form has valid required inputs
  const isFormValid = 
    title.trim() !== "" && 
    ((messageType === "text" && textContent.trim() !== "") || 
     (messageType === "video" && videoContent.trim() !== "")) &&
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
      // Determine which content to use based on message type
      let messageContent;
      
      // Special handling for combined content
      if (messageType === "video" && videoContent) {
        // Start with video content
        messageContent = videoContent;
        
        // If there's text content, combine it with the video
        if (textContent && textContent.trim() !== '') {
          try {
            // Parse the video content to add text content to it
            const videoContentObj = JSON.parse(videoContent);
            videoContentObj.additionalText = textContent;
            messageContent = JSON.stringify(videoContentObj);
          } catch (error) {
            console.error("Error combining text and video content:", error);
            messageContent = videoContent; // Fall back to just video content
          }
        }
      } else if (messageType === "text") {
        messageContent = textContent;
      } else {
        messageContent = content;
      }
      
      // Create the basic message with location data if enabled
      const message = await createMessage(
        userId, 
        title, 
        messageContent, 
        messageType, 
        files,
        // Location data
        shareLocation ? {
          latitude: locationLatitude,
          longitude: locationLongitude,
          name: locationName,
          shareLocation
        } : null
      );
      
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
          
          // Values are already stored as minutes, no need to convert
          console.log("Using reminder minutes:", reminderMinutes);
          
          await createMessageCondition(
            message.id,
            conditionType as TriggerType,
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
              
              // Reminders - now using minutes instead of decimal hours
              reminderHours: reminderMinutes,
              
              // Panic trigger settings
              panicTriggerConfig,
              
              // Recipients - now using the actual recipient objects
              checkInCode: checkInCode || undefined,
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
