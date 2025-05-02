import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageFormProvider, useMessageForm } from "./MessageFormContext";
import { useFormActions } from "./FormActions";
import { MessageDetails } from "./FormSections/MessageDetails";
import { UploadProgressDialog } from "./FormSections/UploadProgressDialog";
import { DeadManSwitch } from "./FormSections/DeadManSwitch";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, Users, Shield } from "lucide-react";

interface CreateMessageFormProps {
  onCancel: () => void;
}

function MessageForm({ onCancel }: CreateMessageFormProps) {
  const { isLoading, files, showUploadDialog, setShowUploadDialog, uploadProgress } = useMessageForm();
  const { handleSubmit, isFormValid } = useFormActions();
  const [activeTab, setActiveTab] = useState("message");

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="message">
                  <FileText className="mr-2 h-4 w-4" />
                  Message Content
                </TabsTrigger>
                <TabsTrigger value="trigger">
                  <Clock className="mr-2 h-4 w-4" />
                  Trigger Settings
                </TabsTrigger>
                <TabsTrigger value="recipients">
                  <Users className="mr-2 h-4 w-4" />
                  Recipients
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="message">
                <MessageDetails />
              </TabsContent>
              
              <TabsContent value="trigger">
                <DeadManSwitch setActiveTab={setActiveTab} />
              </TabsContent>
              
              <TabsContent value="recipients">
                <div className="space-y-4">
                  {/* Recipients content will be implemented later */}
                  <h3 className="text-lg font-medium">Choose Recipients</h3>
                  <p className="text-muted-foreground">Select who will receive this message if triggered.</p>
                  
                  {/* Placeholder for recipients selection */}
                  <div className="rounded-md border border-dashed p-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Recipients selection coming soon</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
