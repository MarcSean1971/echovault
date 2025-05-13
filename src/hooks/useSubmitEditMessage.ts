
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message, TriggerType, MessageCondition } from "@/types/message";
import {
  updateMessageCondition,
  createMessageCondition 
} from "@/services/messages/conditionService";
import { useAttachmentHandler } from "./message-edit/useAttachmentHandler";
import { useContentHandler } from "./message-edit/useContentHandler";
import { useTimeThresholdHandler } from "./message-edit/useTimeThresholdHandler";
import { useRecipientHandler } from "./message-edit/useRecipientHandler";
import { useRecurringPatternHandler } from "./message-edit/useRecurringPatternHandler";

export function useSubmitEditMessage(message: Message, existingCondition: MessageCondition | null) {
  const navigate = useNavigate();
  const { handleAttachments } = useAttachmentHandler();
  const { prepareContent } = useContentHandler();
  const { processTimeThreshold } = useTimeThresholdHandler();
  const { fetchSelectedRecipients } = useRecipientHandler();
  const { processRecurringPattern } = useRecurringPatternHandler();
  
  const { 
    setIsLoading,
    files,
    title,
    content,
    messageType,
    textContent,
    videoContent,
    setShowUploadDialog,
    selectedRecipients,
    conditionType,
    hoursThreshold,
    minutesThreshold,
    recurringPattern,
    triggerDate,
    panicTriggerConfig,
    pinCode,
    unlockDelay,
    expiryHours,
    reminderMinutes,
    checkInCode,
    shareLocation,
    locationName,
    locationLatitude,
    locationLongitude,
    deliveryOption
  } = useMessageForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.id || !message.user_id) return;
    setIsLoading(true);
    
    try {
      // Process attachments
      setShowUploadDialog(true);
      const attachmentsToSave = await handleAttachments(
        message.user_id, 
        files, 
        message.attachments
      );
      setShowUploadDialog(false);
      
      // Process content
      const { 
        contentToSave, 
        finalMessageType, 
        finalTextContent, 
        finalVideoContent 
      } = prepareContent(messageType, textContent, videoContent, content);

      // Update message in database
      const { error } = await supabase
        .from('messages')
        .update({
          title,
          content: contentToSave, // For backward compatibility
          text_content: finalTextContent,
          video_content: finalVideoContent,
          message_type: finalMessageType,
          attachments: attachmentsToSave.length > 0 ? attachmentsToSave : null,
          updated_at: new Date().toISOString(),
          location_latitude: locationLatitude,
          location_longitude: locationLongitude,
          location_name: locationName,
          share_location: shareLocation
        })
        .eq('id', message.id);
        
      if (error) throw error;
      
      // Get recipient data
      const selectedRecipientObjects = await fetchSelectedRecipients(selectedRecipients);
      
      // Process time thresholds for database constraint
      const finalHoursThreshold = processTimeThreshold(hoursThreshold, minutesThreshold);
      
      // Process recurring pattern based on delivery option
      const finalRecurringPattern = processRecurringPattern(deliveryOption, recurringPattern);
      
      // Handle trigger conditions
      if (existingCondition) {
        console.log("Updating existing condition with delivery option:", deliveryOption);
        console.log("Using hours_threshold:", finalHoursThreshold, "minutes_threshold:", minutesThreshold);
        
        // Update existing condition
        await updateMessageCondition(existingCondition.id, {
          condition_type: conditionType,
          hours_threshold: finalHoursThreshold,
          minutes_threshold: minutesThreshold,
          recurring_pattern: finalRecurringPattern,
          pin_code: pinCode || null,
          trigger_date: triggerDate ? triggerDate.toISOString() : null,
          panic_trigger_config: panicTriggerConfig,
          reminder_hours: reminderMinutes, // Values already in minutes
          unlock_delay_hours: unlockDelay,
          expiry_hours: expiryHours,
          recipients: selectedRecipientObjects,
          check_in_code: checkInCode || null
        });
      } else {
        console.log("Creating new condition with delivery option:", deliveryOption);
        console.log("Using hours_threshold:", finalHoursThreshold, "minutes_threshold:", minutesThreshold);
        
        // Create new condition
        await createMessageCondition(
          message.id,
          conditionType as TriggerType,
          {
            hoursThreshold: finalHoursThreshold,
            minutesThreshold,
            triggerDate: triggerDate ? triggerDate.toISOString() : undefined,
            recurringPattern: finalRecurringPattern,
            recipients: selectedRecipientObjects,
            pinCode,
            unlockDelayHours: unlockDelay,
            expiryHours,
            panicTriggerConfig,
            reminderHours: reminderMinutes, // Values already in minutes
            checkInCode: checkInCode || undefined
          }
        );
      }
      
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully",
      });
      
      navigate(`/message/${message.id}`);
    } catch (error: any) {
      console.error("Error updating message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update the message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowUploadDialog(false);
    }
  };

  return {
    handleSubmit
  };
}
