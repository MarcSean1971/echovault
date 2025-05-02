import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageFormProvider, useMessageForm } from "./MessageFormContext";
import { MessageDetails } from "./FormSections/MessageDetails";
import { UploadProgressDialog } from "./FormSections/UploadProgressDialog";
import { DeadManSwitch } from "./FormSections/DeadManSwitch";
import { Separator } from "@/components/ui/separator";
import { FileText, Users } from "lucide-react";
import { RecipientSelector } from "./FormSections/RecipientSelector";
import { useEffect, useState } from "react";
import { Message, MessageCondition, Recipient } from "@/types/message";
import { 
  fetchMessageConditions, 
  updateMessageCondition,
  createMessageCondition 
} from "@/services/messages/conditionService";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachments } from "@/services/messages/fileService";
import { Spinner } from "@/components/ui/spinner";
import { fetchRecipients } from "@/services/messages/recipientService";

interface EditMessageFormProps {
  message: Message;
  onCancel: () => void;
}

function MessageEditForm({ message, onCancel }: EditMessageFormProps) {
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
    setReminderHours
  } = useMessageForm();
  
  const navigate = useNavigate();
  const [existingCondition, setExistingCondition] = useState<MessageCondition | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

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
          setConditionType(messageCondition.condition_type);
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
    
    loadMessageCondition();
  }, [message, setTitle, setContent, setMessageType, setFiles]);

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
      
      // Update message in database
      const { error } = await supabase
        .from('messages')
        .update({
          title,
          content,
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
          recipients: selectedRecipientObjects
        });
      } else {
        console.log("Creating new condition with panic config:", panicTriggerConfig);
        // Create new condition
        await createMessageCondition(
          message.id,
          conditionType,
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
            reminderHours
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
          <CardHeader>
            <CardTitle>Edit Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 mr-2" />
                <h2 className="text-xl font-medium">Message Content</h2>
              </div>
              <MessageDetails />
            </div>
            
            <Separator />
            
            <div>
              <DeadManSwitch />
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 mr-2" />
                <h2 className="text-xl font-medium">Recipients</h2>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground">Select who will receive this message if triggered.</p>
                
                <RecipientSelector 
                  selectedRecipients={selectedRecipients}
                  onSelectRecipient={handleToggleRecipient}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
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

export function EditMessageForm({ message, onCancel }: EditMessageFormProps) {
  return (
    <MessageFormProvider>
      <MessageEditForm message={message} onCancel={onCancel} />
    </MessageFormProvider>
  );
}
