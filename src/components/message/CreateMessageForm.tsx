
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageFormProvider, useMessageForm } from "./MessageFormContext";
import { useFormActions } from "./FormActions";
import { MessageDetails } from "./FormSections/MessageDetails";
import { UploadProgressDialog } from "./FormSections/UploadProgressDialog";
import { DeadManSwitch } from "./FormSections/DeadManSwitch";
import { Separator } from "@/components/ui/separator";
import { FileText, Users } from "lucide-react";
import { RecipientSelector } from "./FormSections/RecipientSelector";

interface CreateMessageFormProps {
  onCancel: () => void;
}

function MessageForm({ onCancel }: CreateMessageFormProps) {
  const { 
    isLoading, 
    files, 
    showUploadDialog, 
    setShowUploadDialog, 
    uploadProgress,
    selectedRecipients,
    setSelectedRecipients
  } = useMessageForm();
  
  const { handleSubmit, isFormValid } = useFormActions();

  // Create a toggle function for recipients that directly sets the array rather than using a function
  const handleToggleRecipient = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      // Filter out the recipientId by creating a new array
      setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
    } else {
      // Add the recipientId by creating a new array
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Message</CardTitle>
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

export function CreateMessageForm(props: CreateMessageFormProps) {
  return (
    <MessageFormProvider>
      <MessageForm {...props} />
    </MessageFormProvider>
  );
}
