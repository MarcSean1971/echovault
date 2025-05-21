
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
          console.log("[MessageFormLoader] LOADED CONDITION:", messageCondition);
          
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
          
          // MODIFIED: Reminder hours handling - don't set defaults
          console.log("[MessageFormLoader] LOADING REMINDER VALUES FROM DB:", messageCondition.reminder_hours);
          
          if (messageCondition.reminder_hours) {
            // Handle array values directly
            if (Array.isArray(messageCondition.reminder_hours)) {
              const minuteValues = messageCondition.reminder_hours.map(Number);
              console.log("[MessageFormLoader] Parsed array values:", minuteValues);
              
              // Filter out any NaN or 0 values
              const validMinutes = minuteValues.filter(min => !isNaN(min) && min > 0);
              
              console.log("[MessageFormLoader] Using valid parsed reminder minutes:", validMinutes);
              setReminderMinutes(validMinutes);
            } 
            // Handle string values (like JSON)
            else if (typeof messageCondition.reminder_hours === 'string') {
              try {
                // Try to parse as JSON array
                const parsed = JSON.parse(messageCondition.reminder_hours);
                if (Array.isArray(parsed)) {
                  const minuteValues = parsed.map(Number);
                  console.log("[MessageFormLoader] Parsed string values:", minuteValues);
                  
                  // Filter out any NaN or 0 values
                  const validMinutes = minuteValues.filter(min => !isNaN(min) && min > 0);
                  
                  console.log("[MessageFormLoader] Using valid JSON parsed reminder minutes:", validMinutes);
                  setReminderMinutes(validMinutes);
                } else {
                  // Single value in JSON
                  const singleValue = Number(parsed);
                  if (!isNaN(singleValue) && singleValue > 0) {
                    console.log("[MessageFormLoader] Using single JSON parsed value:", [singleValue]);
                    setReminderMinutes([singleValue]);
                  } else {
                    console.log("[MessageFormLoader] Invalid single JSON value, using empty array");
                    setReminderMinutes([]);
                  }
                }
              } catch (e) {
                console.error("[MessageFormLoader] Failed to parse reminder_hours string:", e);
                setReminderMinutes([]);
              }
            }
            // Handle numeric values
            else if (typeof messageCondition.reminder_hours === 'number') {
              if (messageCondition.reminder_hours > 0) {
                console.log("[MessageFormLoader] Using numeric reminder value:", [messageCondition.reminder_hours]);
                setReminderMinutes([messageCondition.reminder_hours]);
              } else {
                console.log("[MessageFormLoader] Invalid numeric value, using empty array");
                setReminderMinutes([]);
              }
            }
            // Fallback for unknown types
            else {
              console.log("[MessageFormLoader] Unknown reminder_hours type, using empty array");
              setReminderMinutes([]);
            }
          } else {
            // No reminder_hours set, use empty array instead of default
            console.log("[MessageFormLoader] No reminders found, setting empty array");
            setReminderMinutes([]);
          }
          
          // Set custom check-in code
          setCheckInCode(messageCondition.check_in_code || "");
        } else {
          // No existing condition, set empty reminder array instead of default
          console.log("[MessageFormLoader] No condition found, setting empty reminder array");
          setReminderMinutes([]);
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
    setReminderMinutes,
    setCheckInCode,
    setShareLocation,
    setLocationLatitude,
    setLocationLongitude,
    setLocationName
  ]);
}
