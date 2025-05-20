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
      
      // CRITICAL: Add comprehensive logging for verification
      console.log("=== REMINDER VALUES BEFORE DATABASE UPDATE ===");
      console.log("reminderMinutes (original):", reminderMinutes);
      console.log("reminderMinutes type:", typeof reminderMinutes);
      console.log("reminderMinutes is Array:", Array.isArray(reminderMinutes));
      
      // Create a validated copy of reminder minutes with proper type conversion
      const validatedReminderMinutes = Array.isArray(reminderMinutes) 
        ? reminderMinutes.map(Number) 
        : [1440]; // Default to 24h if not valid array
      
      console.log("validatedReminderMinutes (fixed):", validatedReminderMinutes);
      
      if (existingCondition) {
        console.log("[EditMessage] Updating existing condition ID:", existingCondition.id);
        
        // Update existing condition - ensure reminder_hours gets the validated minutes values
        const updateData = {
          condition_type: conditionType,
          hours_threshold: finalHoursThreshold,
          minutes_threshold: minutesThreshold,
          recurring_pattern: finalRecurringPattern,
          pin_code: pinCode || null,
          trigger_date: triggerDate ? triggerDate.toISOString() : null,
          panic_trigger_config: panicTriggerConfig,
          reminder_hours: validatedReminderMinutes, // Send validated array
          unlock_delay_hours: unlockDelay,
          expiry_hours: expiryHours,
          recipients: selectedRecipientObjects,
          check_in_code: checkInCode || null
        };
        
        console.log("[EditMessage] Condition update data:", JSON.stringify(updateData));
        
        const updatedCondition = await updateMessageCondition(existingCondition.id, updateData);
        
        console.log("[EditMessage] Update response:", updatedCondition);
        
        conditionId = existingCondition.id;
        
        // Additional verification after update to confirm the data was saved correctly
        try {
          const { data: verifyData } = await supabase
            .from('message_conditions')
            .select('reminder_hours')
            .eq('id', conditionId)
            .single();
            
          console.log("[EditMessage] Verification - saved reminder_hours:", verifyData?.reminder_hours);
        } catch (verifyError) {
          console.error("[EditMessage] Verification error:", verifyError);
        }
        
        // Force regenerate reminder schedule
        if (existingCondition.active) {
          console.log("[EditMessage] Regenerating reminder schedule for active condition");
          try {
            await ensureReminderSchedule(conditionId, true); // Fix: Pass boolean instead of string
            console.log("[EditMessage] Successfully updated reminder schedule");
          } catch (scheduleError) {
            console.error("[EditMessage] Error ensuring reminder schedule:", scheduleError);
            toast({
              title: "Warning",
              description: "There was an error updating reminder notifications. Please try again.",
              variant: "destructive"
            });
          }
        }
      } else {
        console.log("[EditMessage] Creating new condition with reminderMinutes:", validatedReminderMinutes);
        
        // Create new condition
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
            reminderHours: validatedReminderMinutes, // Use validated array
            checkInCode: checkInCode || undefined
          }
        );
        
        if (newCondition && newCondition.id) {
          conditionId = newCondition.id;
          console.log("[EditMessage] New condition created with ID:", conditionId);
        }
      }
      
      // Dispatch a custom event to trigger UI refresh before navigating away
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
      console.error("[EditMessage] Error updating message:", error);
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
