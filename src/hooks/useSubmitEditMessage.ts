
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
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";

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
      
      // Get the directly processed hours threshold - no special handling needed now
      const finalHoursThreshold = processTimeThreshold(hoursThreshold, minutesThreshold);
      
      // Process recurring pattern based on delivery option
      const finalRecurringPattern = processRecurringPattern(deliveryOption, recurringPattern);
      
      // Handle trigger conditions
      let conditionId = null;
      
      // CRITICAL: Add comprehensive logging for the reminder minutes values
      console.log("================================================================");
      console.log("SUBMITTING EDIT WITH REMINDER MINUTES:", reminderMinutes);
      console.log("REMINDER MINUTES TYPE:", typeof reminderMinutes);
      console.log("IS ARRAY:", Array.isArray(reminderMinutes));
      console.log("STRINGIFIED:", JSON.stringify(reminderMinutes));
      console.log("================================================================");
      
      if (existingCondition) {
        console.log("Updating existing condition with delivery option:", deliveryOption);
        console.log("Reminder minutes before update:", reminderMinutes);
        
        // FIXED: Always consider timing params changed to force regeneration of reminders
        const timingParamsChanged = true;
        
        // CRITICAL FIX: Create a deeply cloned copy of reminderMinutes to ensure we don't have reference issues
        const reminderMinutesToSave = [...reminderMinutes];
        console.log("Using reminder minutes for update:", reminderMinutesToSave);
        
        // Update existing condition - ensure reminder_hours gets the minutes values
        const updatedCondition = await updateMessageCondition(existingCondition.id, {
          condition_type: conditionType,
          hours_threshold: finalHoursThreshold,
          minutes_threshold: minutesThreshold,
          recurring_pattern: finalRecurringPattern,
          pin_code: pinCode || null,
          trigger_date: triggerDate ? triggerDate.toISOString() : null,
          panic_trigger_config: panicTriggerConfig,
          reminder_hours: reminderMinutesToSave, // Send a copy to prevent mutations
          unlock_delay_hours: unlockDelay,
          expiry_hours: expiryHours,
          recipients: selectedRecipientObjects,
          check_in_code: checkInCode || null
        });
        
        conditionId = existingCondition.id;
        
        // ENHANCED DEBUGGING: Log successful update
        console.log("Update successful, new reminder minutes:", reminderMinutesToSave);
        console.log("Full updated condition:", updatedCondition);
        
        // Force regenerate reminder schedule regardless of timing parameter changes if the condition is active
        if (existingCondition.active) {
          console.log("Condition is active, regenerating reminder schedule");
          try {
            await ensureReminderSchedule(conditionId, message.id);
            console.log("Successfully updated reminder schedule after edit");
          } catch (scheduleError) {
            console.error("Error ensuring reminder schedule:", scheduleError);
            toast({
              title: "Warning",
              description: "There was an error updating reminder notifications. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          console.log("Skipping reminder schedule update - condition inactive");
        }
      } else {
        console.log("Creating new condition with delivery option:", deliveryOption);
        console.log("Initial reminder minutes:", reminderMinutes);
        
        // Create new condition - reminder schedule will not be created due to changes in createConditionInDb
        const newCondition = await createMessageCondition(
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
            reminderHours: [...reminderMinutes], // Clone the array to prevent mutations
            checkInCode: checkInCode || undefined
          }
        );
        
        if (newCondition && newCondition.id) {
          conditionId = newCondition.id;
          console.log("New condition created, but reminders will only be generated when armed");
        }
      }
      
      // Dispatch a custom event to trigger UI refresh before navigating away
      console.log("Message updated, dispatching conditions-updated event");
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          messageId: message.id, 
          conditionId, 
          updatedAt: new Date().toISOString() 
        }
      }));
      
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

  // Helper function removed as we're always forcing reminder regeneration

  return {
    handleSubmit
  };
}
