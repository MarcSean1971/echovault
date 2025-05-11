
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Message } from "@/types/message";
import { UploadProgressDialog } from "./UploadProgressDialog";
import { EditMessageHeader } from "./EditMessageHeader";
import { EditMessageContent } from "./EditMessageContent";
import { EditMessageFooter } from "./EditMessageFooter";
import { MessageFormProvider } from "../MessageFormContext";
import { useEditMessageForm } from "@/hooks/useEditMessageForm";
import { useSubmitEditMessage } from "@/hooks/useSubmitEditMessage";

interface EditMessageFormComponentProps {
  message: Message;
  onCancel: () => void;
}

function MessageEditForm({ message, onCancel }: EditMessageFormComponentProps) {
  const {
    isLoading,
    initialLoading,
    showUploadDialog,
    setShowUploadDialog,
    uploadProgress,
    files,
    selectedRecipients,
    handleToggleRecipient,
    isFormValid,
    existingCondition
  } = useEditMessageForm(message, onCancel);
  
  const { handleSubmit } = useSubmitEditMessage(message, existingCondition);

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
