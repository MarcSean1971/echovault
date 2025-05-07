
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

interface SendTestMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageTitle: string;
  recipients: { id: string; name: string; email: string }[];
  onSendTestMessages: (selectedRecipients: { id: string; name: string; email: string }[]) => Promise<void>;
}

export function SendTestMessageDialog({
  open,
  onOpenChange,
  messageTitle,
  recipients,
  onSendTestMessages
}: SendTestMessageDialogProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset selections when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedRecipients([]);
      setIsLoading(false);
    } else {
      // Pre-select all recipients by default
      setSelectedRecipients([...recipients]);
    }
  }, [open, recipients]);

  const toggleRecipient = (recipient: { id: string; name: string; email: string }) => {
    if (selectedRecipients.some(r => r.id === recipient.id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients([...recipients]);
    }
  };

  const handleSendTest = async () => {
    try {
      setIsLoading(true);
      await onSendTestMessages(selectedRecipients);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending test messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Message</DialogTitle>
          <DialogDescription>
            Send a test version of "{messageTitle}" to selected recipients.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {recipients.length > 0 ? (
            <>
              <div className="flex items-center space-x-2 pb-4">
                <Checkbox 
                  id="select-all" 
                  checked={selectedRecipients.length === recipients.length && recipients.length > 0}
                  onCheckedChange={toggleAllRecipients}
                />
                <Label htmlFor="select-all" className="font-medium">Select All Recipients</Label>
              </div>
              
              <div className="border rounded-md divide-y">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center space-x-2 p-3">
                    <Checkbox 
                      id={`recipient-${recipient.id}`}
                      checked={selectedRecipients.some(r => r.id === recipient.id)}
                      onCheckedChange={() => toggleRecipient(recipient)}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor={`recipient-${recipient.id}`} className="font-medium">{recipient.name}</Label>
                      <span className="text-sm text-muted-foreground">{recipient.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center py-6 text-muted-foreground">No recipients available for this message.</p>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendTest} 
            disabled={selectedRecipients.length === 0 || isLoading}
          >
            {isLoading ? "Sending..." : (
              <>
                <Send className="h-4 w-4 mr-2" /> Send Test
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
