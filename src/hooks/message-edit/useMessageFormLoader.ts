
import { useEffect } from "react";
import { Message, MessageCondition, TriggerType } from "@/types/message";
import { fetchMessageConditions } from "@/services/messages/conditionService";
import { fetchRecipients } from "@/services/messages/recipientService";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { toast } from "@/components/ui/use-toast";

export function useMessageFormLoader(message: Message) {
  const { 
    setTitle,
    setContent,
    setMessageType,
    setFiles,
    setConditionType,
    setHoursThreshold,
    setMinutesThreshold,
    setSelectedRecipients,
    setRecurringPattern,
    setTriggerDate,
    setPanicTriggerConfig,
    setPinCode,
    setUnlockDelay,
    setExpiryHours,
    setDeliveryOption,
    setReminderMinutes, // Important: This handles minutes values
    setCheckInCode,
    setShareLocation,
    setLocationLatitude,
    setLocationLongitude,
    setLocationName
  } = useMessageForm();

  // Load message condition data
  useEffect(() => {
    const loadMessageData = async () => {
      try {
        // Populate the form with current message data
        setTitle(message.title);
        setContent(message.content || "");
        setMessageType(message.message_type);
        
        // Load location data from the message
        setShareLocation(message.share_location || false);
        setLocationLatitude(message.location_latitude || null);
        setLocationLongitude(message.location_longitude || null);
        setLocationName(message.location_name || null);
        
        // If there are attachments, set them
        if (message.attachments && Array.isArray(message.attachments)) {
          setFiles(message.attachments.map(att => ({
            file: null,
            name: att.name,
            size: att.size,
            type: att.type,
            path: att.path,
            isUploaded: true
          })));
        }

        // Load message conditions and recipients
        await loadMessageCondition(message.id, message.user_id);
      } catch (error) {
        console.error("Error initializing message form:", error);
        toast({
          title: "Error",
          description: "Failed to load message data",
          variant: "destructive"
        });
      }
    };

    const loadMessageCondition = async (messageId: string, userId: string) => {
      try {
        // Fetch message conditions
        const conditions = await fetchMessageConditions(userId);
        const messageCondition = conditions.find(c => c.message_id === messageId);
        
        if (messageCondition) {
          if (messageCondition.condition_type) {
            setConditionType(messageCondition.condition_type as TriggerType);
          }
          
          setHoursThreshold(messageCondition.hours_threshold);
          setMinutesThreshold(messageCondition.minutes_threshold || 0);
          
          // Set recipients if they exist
          if (messageCondition.recipients && messageCondition.recipients.length > 0) {
            setSelectedRecipients(messageCondition.recipients.map(r => r.id));
          }
          
          // Set recurring pattern if it exists
          if (messageCondition.recurring_pattern) {
            setRecurringPattern(messageCondition.recurring_pattern);
          }
          
          // Set trigger date if it exists
          if (messageCondition.trigger_date) {
            setTriggerDate(new Date(messageCondition.trigger_date));
          }
          
          // Set panic trigger config if it exists
          if (messageCondition.panic_trigger_config) {
            setPanicTriggerConfig(messageCondition.panic_trigger_config);
          } else if (messageCondition.panic_config) {
            setPanicTriggerConfig(messageCondition.panic_config);
          }
          
          // Set security options
          setPinCode(messageCondition.pin_code || "");
          setUnlockDelay(messageCondition.unlock_delay_hours || 0);
          setExpiryHours(messageCondition.expiry_hours || 0);
          
          // Set delivery option based on condition
          if (messageCondition.recurring_pattern) {
            setDeliveryOption("recurring");
          } else if (messageCondition.trigger_date) {
            setDeliveryOption("scheduled");
          } else {
            setDeliveryOption("once");
          }
          
          // CRITICAL FIX: reminder_hours already stores minutes values
          if (messageCondition.reminder_hours && messageCondition.reminder_hours.length > 0) {
            console.log("Setting reminder minutes from condition:", messageCondition.reminder_hours);
            setReminderMinutes(messageCondition.reminder_hours);
          }
          
          // Set custom check-in code
          setCheckInCode(messageCondition.check_in_code || "");
        }
        
        // Load all recipients for selection
        await fetchRecipients();

      } catch (error) {
        console.error("Error loading message condition:", error);
        throw error;
      }
    };

    loadMessageData();
  }, [
    message,
    setTitle,
    setContent,
    setMessageType,
    setFiles,
    setConditionType,
    setHoursThreshold,
    setMinutesThreshold,
    setSelectedRecipients,
    setRecurringPattern,
    setTriggerDate,
    setPanicTriggerConfig,
    setPinCode,
    setUnlockDelay,
    setExpiryHours,
    setDeliveryOption,
    setReminderMinutes, // Important: This handles minutes values
    setCheckInCode,
    setShareLocation,
    setLocationLatitude,
    setLocationLongitude,
    setLocationName
  ]);
}
