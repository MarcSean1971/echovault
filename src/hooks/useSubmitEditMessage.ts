
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
      if (existingCondition) {
        console.log("Updating existing condition with delivery option:", deliveryOption);
        
        // CRITICAL FIX: Check if timing-related parameters have changed to determine if we need to regenerate reminders
        const timingParamsChanged = hasTimingParamsChanged(existingCondition, {
          hoursThreshold: finalHoursThreshold,
          minutesThreshold,
          reminderMinutes,
          triggerDate: triggerDate ? triggerDate.toISOString() : null,
          recurringPattern: finalRecurringPattern
        });
        
        // Update existing condition
        const updatedCondition = await updateMessageCondition(existingCondition.id, {
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
        
        conditionId = existingCondition.id;
        
        // Only regenerate reminder schedule if the condition is active AND timing parameters changed
        if (existingCondition.active && timingParamsChanged) {
          console.log("Condition is active and timing parameters changed, regenerating reminder schedule");
          try {
            await ensureReminderSchedule(conditionId, message.id);
            console.log("Successfully updated reminder schedule after edit");
          } catch (scheduleError) {
            console.error("Error ensuring reminder schedule:", scheduleError);
          }
        } else {
          console.log("Skipping reminder schedule update - condition inactive or timing parameters unchanged");
        }
      } else {
        console.log("Creating new condition with delivery option:", deliveryOption);
        
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
            reminderHours: reminderMinutes, // Values already in minutes
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

  // Helper function to check if timing-related parameters have changed
  const hasTimingParamsChanged = (
    existingCondition: MessageCondition, 
    newParams: {
      hoursThreshold: number;
      minutesThreshold: number;
      reminderMinutes: number[];
      triggerDate: string | null;
      recurringPattern: any;
    }
  ): boolean => {
    // Check hours threshold change
    if (existingCondition.hours_threshold !== newParams.hoursThreshold) {
      return true;
    }
    
    // Check minutes threshold change
    if (existingCondition.minutes_threshold !== newParams.minutesThreshold) {
      return true;
    }
    
    // Check reminder hours change (deep comparison needed as it's an array)
    const existingReminderMinutes = existingCondition.reminder_hours || [];
    const newReminderMinutes = newParams.reminderMinutes || [];
    
    if (existingReminderMinutes.length !== newReminderMinutes.length) {
      return true;
    }
    
    // Sort both arrays to ensure we're comparing the same values
    const sortedExisting = [...existingReminderMinutes].sort((a, b) => a - b);
    const sortedNew = [...newReminderMinutes].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedExisting.length; i++) {
      if (sortedExisting[i] !== sortedNew[i]) {
        return true;
      }
    }
    
    // Check trigger date change
    const existingTriggerDate = existingCondition.trigger_date || null;
    const newTriggerDate = newParams.triggerDate || null;
    
    if ((existingTriggerDate === null && newTriggerDate !== null) || 
        (existingTriggerDate !== null && newTriggerDate === null)) {
      return true;
    }
    
    if (existingTriggerDate && newTriggerDate && 
        new Date(existingTriggerDate).getTime() !== new Date(newTriggerDate).getTime()) {
      return true;
    }
    
    // Check recurring pattern change
    const existingPattern = existingCondition.recurring_pattern;
    const newPattern = newParams.recurringPattern;
    
    if ((existingPattern === null && newPattern !== null) || 
        (existingPattern !== null && newPattern === null)) {
      return true;
    }
    
    if (existingPattern && newPattern && 
        JSON.stringify(existingPattern) !== JSON.stringify(newPattern)) {
      return true;
    }
    
    return false;
  };

  return {
    handleSubmit
  };
}
