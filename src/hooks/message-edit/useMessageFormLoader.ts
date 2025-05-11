
import { useEffect } from "react";
import { Message } from "@/types/message";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { FileAttachment } from "@/components/FileUploader";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to load message data into the message form context
 */
export function useMessageFormLoader(message: Message) {
  const { 
    setTitle,
    setContent,
    setSelectedRecipients,
    setFiles,
    setConditionType,
    setHoursThreshold,
    setMinutesThreshold,
    setRecurringPattern,
    setPanicTriggerConfig,
    setPinCode,
    setReminderHours,
    setExpiryHours,
    setUnlockDelay,
    setTriggerDate,
    setShareLocation,
    setLocationName,
    setLocationLatitude,
    setLocationLongitude,
    setTextContent,
    setVideoContent
  } = useMessageForm();

  useEffect(() => {
    if (!message) return;
    
    try {
      // Load basic message data
      setTitle(message.title);
      setContent(message.content || '');
      
      // Handle message type specific content
      if (message.message_type === 'text') {
        setTextContent(message.content || '');
      } else if (message.message_type === 'video') {
        setVideoContent(message.content || '');
      }
      
      // Load attachments data
      if (message.attachments && message.attachments.length > 0) {
        console.log("MessageFormLoader: Loading attachments", message.attachments);
        const attachments: FileAttachment[] = message.attachments.map(att => ({
          file: null, // No file object for existing attachments
          name: att.name,
          size: att.size,
          type: att.type || 'application/octet-stream',
          path: att.path,
          isUploaded: true // Mark as already uploaded
        }));
        setFiles(attachments);
      } else {
        setFiles([]);
      }
      
      // Load location data if available
      if (message.share_location) {
        setShareLocation(true);
        setLocationName(message.location_name);
        setLocationLatitude(message.location_latitude);
        setLocationLongitude(message.location_longitude);
      }

      // Selected recipients and conditions will be handled separately
      // since they require async data loading
      
    } catch (error) {
      console.error("Error loading message data:", error);
      toast({
        title: "Error",
        description: "Failed to load message data",
        variant: "destructive"
      });
    }
  }, [message]);
}
