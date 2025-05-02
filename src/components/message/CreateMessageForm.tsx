
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageFormProvider, useMessageForm } from "./MessageFormContext";
import { useFormActions } from "./FormActions";
import { MessageDetails } from "./FormSections/MessageDetails";
import { UploadProgressDialog } from "./FormSections/UploadProgressDialog";

interface CreateMessageFormProps {
  onCancel: () => void;
}

function MessageForm({ onCancel }: CreateMessageFormProps) {
  const { isLoading, files, showUploadDialog, setShowUploadDialog, uploadProgress } = useMessageForm();
  const { handleSubmit, isFormValid } = useFormActions();

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MessageDetails />
            {/* DeadManSwitch component has been removed */}
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
