import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useMessageForm } from "../MessageFormContext";
import { UploadProgressDialog } from "./UploadProgressDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachments } from "@/services/messages/fileService";
import { Spinner } from "@/components/ui/spinner";
import { fetchRecipients } from "@/services/messages/recipientService";
import { Message, MessageCondition, Recipient, TriggerType } from "@/types/message";
import { 
  fetchMessageConditions, 
  updateMessageCondition,
  createMessageCondition 
} from "@/services/messages/conditionService";
import { parseVideoContent } from "@/services/messages/mediaService";

// Import the component files
import { EditMessageHeader } from "./EditMessageHeader";
import { EditMessageContent } from "./EditMessageContent";
import { EditMessageFooter } from "./EditMessageFooter";

interface EditMessageFormComponentProps {
  message: Message;
  onCancel: () => void;
}

function MessageEditForm({ message, onCancel }: EditMessageFormComponentProps) {
  const { 
    isLoading, 
    setIsLoading,
    files, 
    setFiles,
    title,
    setTitle,
    content,
    setContent,
    messageType,
    setMessageType,
    textContent,
    videoContent,
    showUploadDialog, 
    setShowUploadDialog, 
    uploadProgress,
    selectedRecipients,
    setSelectedRecipients,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold,
    setMinutesThreshold,
    recurringPattern,
    setRecurringPattern,
    triggerDate,
    setTriggerDate,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    deliveryOption,
    setDeliveryOption,
    reminderHours,
    setReminderHours,
    checkInCode,
    setCheckInCode
  } = useMessageForm();
  
  const navigate = useNavigate();
  const [existingCondition, setExistingCondition] = useState<MessageCondition | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [contentValidationError, setContentValidationError] = useState<string | null>(null);

  // Load message condition data
  useEffect(() => {
    const loadMessageCondition = async () => {
      try {
        // Fetch message conditions
        const conditions = await fetchMessageConditions(message.user_id);
        const messageCondition = conditions.find(c => c.message_id === message.id);
        
        if (messageCondition) {
          setExistingCondition(messageCondition);
          
          // Populate form with condition data
          if (messageCondition.condition_type) {
            setConditionType(messageCondition.condition_type as TriggerType);
          }
          setHoursThreshold(messageCondition.hours_threshold);
          setMinutesThreshold(messageCondition.minutes_threshold || 0);
          
          // Set recipients if they exist
          if (messageCondition.recipients && messageCondition.recipients.length > 0) {
            setRecipients(messageCondition.recipients);
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
            console.log("Loading panic trigger config:", messageCondition.panic_trigger_config);
            setPanicTriggerConfig(messageCondition.panic_trigger_config);
          } else if (messageCondition.panic_config) {
            // Fallback to panic_config if panic_trigger_config doesn't exist
            console.log("Loading panic config:", messageCondition.panic_config);
            setPanicTriggerConfig(messageCondition.panic_config);
          }
          
          // Set security options if they exist
          if (messageCondition.pin_code) {
            setPinCode(messageCondition.pin_code);
          }
          
          if (messageCondition.unlock_delay_hours) {
            setUnlockDelay(messageCondition.unlock_delay_hours);
          }
          
          if (messageCondition.expiry_hours) {
            setExpiryHours(messageCondition.expiry_hours);
          }
          
          // Set delivery option based on condition
          if (messageCondition.recurring_pattern) {
            setDeliveryOption("recurring");
          } else if (messageCondition.trigger_date) {
            setDeliveryOption("scheduled");
          } else {
            setDeliveryOption("once");
          }
          
          // Set reminder hours if they exist
          if (messageCondition.reminder_hours && messageCondition.reminder_hours.length > 0) {
            setReminderHours(messageCondition.reminder_hours);
          }
          
          // Set custom check-in code if it exists
          if (messageCondition.check_in_code) {
            setCheckInCode(messageCondition.check_in_code);
          }
        }
        
        // Load all recipients for selection
        const allRecipients = await fetchRecipients();
        setRecipients(allRecipients);
      } catch (error) {
        console.error("Error loading message condition:", error);
        toast({
          title: "Error",
          description: "Failed to load message settings",
          variant: "destructive"
        });
      } finally {
        setInitialLoading(false);
      }
    };
    
    // Populate the form with current message data
    setTitle(message.title);
    setContent(message.content || "");
    setMessageType(message.message_type);
    
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
    
    // Validate the message content matches the type
    if (message.message_type === "video" && message.content) {
      const { videoData, error, diagnostics } = parseVideoContent(message.content);
      if (!videoData) {
        console.error("Invalid video content detected:", error, diagnostics);
        setContentValidationError(`The message is marked as video type but contains invalid video content. You may need to re-record your video.`);
        
        // Auto-switch to text type if content appears to be text
        if (diagnostics?.contentType === "plain-text") {
          console.log("Auto-switching to text type due to plain text content");
          setMessageType("text");
          toast({
            title: "Content Type Mismatch",
            description: "This message was saved as video but contains text content. Switched to text mode.",
            variant: "destructive",
          });
        }
      }
    }
    
    loadMessageCondition();
  }, [message, setTitle, setContent, setMessageType, setFiles, setConditionType, setHoursThreshold, setMinutesThreshold, setSelectedRecipients, setRecipients, setRecurringPattern, setTriggerDate, setPanicTriggerConfig, setPinCode, setUnlockDelay, setExpiryHours, setDeliveryOption, setReminderHours, setCheckInCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.id || !message.user_id) return;
    setIsLoading(true);
    setContentValidationError(null);
    
    try {
      // Validate content based on message type
      if (messageType === "video" && (!videoContent || videoContent.trim() === "")) {
        throw new Error("Video message type requires recorded video content. Please record a video before saving.");
      }
      
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
      
      // Determine which content to use based on message type
      // For combined content support, we'll use a special approach
      let contentToSave = content;
      
      // If we have video content, we'll use that as the primary content
      if (messageType === "video") {
        if (!videoContent || videoContent.trim() === "") {
          throw new Error("Video message requires video content. Please record a video before saving.");
        }
        
        contentToSave = videoContent;
        
        // If we also have text content, add it to the video content
        if (textContent && textContent.trim() !== '') {
          try {
            // Parse the video content to add text content to it
            const videoContentObj = JSON.parse(videoContent);
            videoContentObj.additionalText = textContent;
            contentToSave = JSON.stringify(videoContentObj);
          } catch (error) {
            console.error("Error combining text and video content:", error);
            throw new Error("Error preparing video content. Please try re-recording your video.");
          }
        }
        
        // Validate that the content actually contains video data
        const { videoData, error } = parseVideoContent(contentToSave);
        if (!videoData) {
          console.error("Invalid video content detected on save:", error);
          throw new Error("The video content is invalid or corrupted. Please try re-recording your video.");
        }
      } else if (messageType === "text") {
        contentToSave = textContent;
      }

      // Update message in database
      const { error } = await supabase
        .from('messages')
        .update({
          title,
          content: contentToSave,
          message_type: messageType,
          attachments: attachmentsToSave.length > 0 ? attachmentsToSave : null,
          updated_at: new Date().toISOString()
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
          reminder_hours: reminderHours,
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
            reminderHours,
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
      
      // Set content validation error if it's related to content
      if (error.message && (
        error.message.includes("video content") || 
        error.message.includes("Video message")
      )) {
        setContentValidationError(error.message);
      }
      
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

  // Toggle function for recipients
  const handleToggleRecipient = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  const isFormValid = title.trim() !== "" && 
    (messageType !== "text" || content.trim() !== "") &&
    (messageType !== "video" || videoContent) &&
    selectedRecipients.length > 0;

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
        <span className="ml-2">Loading message data...</span>
      </div>
    );
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <EditMessageHeader onCancel={onCancel} />
          
          {contentValidationError && (
            <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              <strong>Content Error:</strong> {contentValidationError}
              <div className="mt-1 text-sm">
                You may need to re-record your video or change the message type to match your content.
              </div>
            </div>
          )}
          
          <EditMessageContent 
            message={message}
            selectedRecipients={selectedRecipients}
            handleToggleRecipient={handleToggleRecipient}
          />
          
          <EditMessageFooter 
            onCancel={onCancel}
            isLoading={isLoading}
            isFormValid={isFormValid}
          />
        </form>
      </Card>

      <UploadProgressDialog 
        showUploadDialog={showUploadDialog}
        setShowUploadDialog={setShowUploadDialog}
        uploadProgress={uploadProgress}
        files={files}
        isLoading={isLoading}
      />
    </>
  );
}

export function EditMessageForm({ message, onCancel }: EditMessageFormComponentProps) {
  return (
    <MessageFormProvider>
      <MessageEditForm message={message} onCancel={onCancel} />
    </MessageFormProvider>
  );
}

// Import MessageFormProvider here so it's available for the exported component
import { MessageFormProvider } from "../MessageFormContext";
