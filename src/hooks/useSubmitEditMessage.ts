import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachments } from "@/services/messages/fileService";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { fetchRecipients } from "@/services/messages/recipientService";
import { Message, TriggerType, MessageCondition } from "@/types/message";
import {
  updateMessageCondition,
  createMessageCondition 
} from "@/services/messages/conditionService";

export function useSubmitEditMessage(message: Message, existingCondition: MessageCondition | null) {
  const navigate = useNavigate();
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
    reminderHours,
    checkInCode,
    shareLocation,
    locationName,
    locationLatitude,
    locationLongitude
  } = useMessageForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.id || !message.user_id) return;
    setIsLoading(true);
    
    try {
      // Upload any new files that haven't been uploaded
      const newFiles = files.filter(f => f.file && !f.isUploaded);
      let attachmentsToSave = [...(message.attachments || [])].filter(
        // Filter out any deleted attachments
        attachment => files.some(f => f.path === attachment.path)
      );
      
      if (newFiles.length > 0) {
        setShowUploadDialog(true);
        const uploadedFiles = await uploadAttachments(message.user_id, newFiles);
        setShowUploadDialog(false);
        attachmentsToSave = [
          ...attachmentsToSave,
          ...uploadedFiles
        ];
      }
      
      // Log the current state of content before saving
      console.log("Message edit - content state before save:", {
        messageType,
        hasTextContent: !!textContent && textContent.trim() !== '',
        hasVideoContent: !!videoContent && videoContent.trim() !== '',
        textContentLength: textContent?.length || 0,
        videoContentLength: videoContent?.length || 0,
        content: content ? content.substring(0, 30) + "..." : "none"
      });
      
      // IMPROVED CONTENT HANDLING: Always check for both text and video content
      let contentToSave = null;
      let finalMessageType = messageType;
      
      // Check if we have valid video content
      const hasValidVideo = videoContent && 
        (videoContent.includes('videoData') || 
          (videoContent.startsWith('{') && videoContent.endsWith('}')));
      
      // Check if we have valid text content
      const hasValidText = textContent && textContent.trim() !== '';
      
      if (hasValidVideo && hasValidText) {
        // We have both video and text content - combine them
        console.log("Saving both video and text content together");
        try {
          // Parse the video content to add text content to it
          const videoContentObj = JSON.parse(videoContent);
          videoContentObj.additionalText = textContent;
          contentToSave = JSON.stringify(videoContentObj);
          // When we have both, use video as the primary type for correct rendering
          finalMessageType = "video";
          console.log("Combined content created with both text and video");
        } catch (error) {
          console.error("Error combining text and video content:", error);
          // Fallback to using the selected tab's content
          contentToSave = messageType === "video" ? videoContent : textContent;
        }
      } else if (hasValidVideo) {
        // Only video content available
        console.log("Saving video content only");
        contentToSave = videoContent;
        finalMessageType = "video";
      } else if (hasValidText) {
        // Only text content available
        console.log("Saving text content only");
        contentToSave = textContent;
        finalMessageType = "text";
      } else {
        // No valid content - this should not normally happen
        console.log("No valid content found to save");
        contentToSave = content; // Use whatever was there before
      }
      
      console.log("Final content to save:", contentToSave ? contentToSave.substring(0, 30) + "..." : "none");
      console.log("Final message type:", finalMessageType);

      // Update message in database
      const { error } = await supabase
        .from('messages')
        .update({
          title,
          content: contentToSave,
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
      
      // Fetch actual recipient data for the selected recipient IDs
      let selectedRecipientObjects = [];
      if (selectedRecipients.length > 0) {
        const allRecipients = await fetchRecipients();
        selectedRecipientObjects = allRecipients.filter(recipient => 
          selectedRecipients.includes(recipient.id)
        );
        
        if (selectedRecipientObjects.length === 0) {
          throw new Error("No valid recipients found. Please check your recipient selection.");
        }
      } else {
        throw new Error("Please select at least one recipient.");
      }
      
      // Convert decimal reminder hours to integers by multiplying by 60 (to minutes)
      // This fixes the "Invalid input syntax for type integer" error
      const reminderMinutes = reminderHours.map(hour => {
        // If hour is already an integer, just multiply by 60
        // Otherwise, convert the fractional hours to minutes
        if (Number.isInteger(hour)) {
          return hour * 60;
        }
        
        // For fractional values, convert to minutes and round
        return Math.round(hour * 60);
      });
      
      console.log("Converting reminder hours to minutes:", reminderHours, "->", reminderMinutes);
      
      // Handle trigger conditions
      if (existingCondition) {
        console.log("Updating existing condition with panic config:", panicTriggerConfig);
        // Update existing condition
        await updateMessageCondition(existingCondition.id, {
          condition_type: conditionType,
          hours_threshold: hoursThreshold,
          minutes_threshold: minutesThreshold,
          recurring_pattern: recurringPattern,
          pin_code: pinCode || null,
          trigger_date: triggerDate ? triggerDate.toISOString() : null,
          panic_trigger_config: panicTriggerConfig,
          reminder_hours: reminderMinutes, // Use minutes instead of decimal hours
          unlock_delay_hours: unlockDelay,
          expiry_hours: expiryHours,
          recipients: selectedRecipientObjects,
          check_in_code: checkInCode || null
        });
      } else {
        console.log("Creating new condition with panic config:", panicTriggerConfig);
        // Create new condition
        await createMessageCondition(
          message.id,
          conditionType as TriggerType,
          {
            hoursThreshold,
            minutesThreshold,
            triggerDate: triggerDate ? triggerDate.toISOString() : undefined,
            recurringPattern,
            recipients: selectedRecipientObjects,
            pinCode,
            unlockDelayHours: unlockDelay,
            expiryHours,
            panicTriggerConfig,
            reminderHours: reminderMinutes, // Use minutes instead of decimal hours
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
