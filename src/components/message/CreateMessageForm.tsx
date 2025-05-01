
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createMessage } from "@/services/messages/messageService";
import { createMessageCondition } from "@/services/messages/conditionService";
import { fetchRecipients } from "@/services/messages/recipientService";
import { FileAttachment } from "@/components/FileUploader";
import { MessageDetails } from "./FormSections/MessageDetails";
import { DeadManSwitch } from "./FormSections/DeadManSwitch";
import { UploadProgressDialog } from "./FormSections/UploadProgressDialog";
import { TriggerType } from "@/types/message";

interface CreateMessageFormProps {
  onCancel: () => void;
}

export function CreateMessageForm({ onCancel }: CreateMessageFormProps) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Dead man's switch related states
  const [enableDeadManSwitch, setEnableDeadManSwitch] = useState(false);
  const [conditionType, setConditionType] = useState<TriggerType>('no_check_in');
  const [hoursThreshold, setHoursThreshold] = useState(72); // Default 72 hours (3 days)
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be signed in to create a message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    if (files.length > 0) {
      setShowUploadDialog(true);
      simulateUploadProgress();
    }

    try {
      // First, create the message
      const newMessage = await createMessage(
        userId,
        title,
        messageType === "text" ? content : null,
        messageType,
        files
      );
      
      // If dead man's switch is enabled, create the message condition
      if (enableDeadManSwitch && selectedRecipients.length > 0) {
        const selectedRecipientObjects = await fetchSelectedRecipients(selectedRecipients);
        
        await createMessageCondition(
          newMessage.id,
          conditionType,
          {
            hoursThreshold,
            recipients: selectedRecipientObjects
          }
        );
      }
      
      toast({
        title: "Message created",
        description: enableDeadManSwitch 
          ? "Your message has been saved with dead man's switch enabled" 
          : "Your message has been saved securely"
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating message:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem creating your message",
        variant: "destructive"
      });
      setShowUploadDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  // This function gets full recipient objects from the selected IDs
  const fetchSelectedRecipients = async (ids: string[]) => {
    try {
      const allRecipients = await fetchRecipients();
      return allRecipients.filter(recipient => ids.includes(recipient.id));
    } catch (error) {
      console.error("Error fetching recipients:", error);
      return [];
    }
  };

  // This is just to simulate upload progress for UI feedback
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MessageDetails 
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              messageType={messageType}
              setMessageType={setMessageType}
              files={files}
              setFiles={setFiles}
              isLoading={isLoading}
            />

            <DeadManSwitch 
              enableDeadManSwitch={enableDeadManSwitch}
              setEnableDeadManSwitch={setEnableDeadManSwitch}
              conditionType={conditionType}
              setConditionType={setConditionType}
              hoursThreshold={hoursThreshold}
              setHoursThreshold={setHoursThreshold}
              selectedRecipients={selectedRecipients}
              setSelectedRecipients={setSelectedRecipients}
              userId={userId}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                (messageType === "text" && !content) ||
                (enableDeadManSwitch && selectedRecipients.length === 0)
              }
            >
              {isLoading ? "Saving..." : "Save Message"}
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
