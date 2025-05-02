
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SendTestMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageTitle: string;
  recipients: { id: string; name: string; email: string }[];
}

export function SendTestMessageDialog({
  open,
  onOpenChange,
  messageTitle,
  recipients,
}: SendTestMessageDialogProps) {
  const { user } = useAuth();
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [hasSendingStarted, setHasSendingStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App name constant
  const APP_NAME = "EchoVault";

  // Function to select/deselect all recipients
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(recipients.map(r => r.id));
    } else {
      setSelectedRecipients([]);
    }
  };

  // Function to toggle selection of a single recipient
  const handleToggleRecipient = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  // Function to send test emails
  const handleSend = async () => {
    if (!user?.email) return;
    
    setIsSending(true);
    setHasSendingStarted(true);
    setSentCount(0);
    setError(null);
    
    try {
      const selectedRecipientsData = recipients.filter(r => 
        selectedRecipients.includes(r.id)
      );
      
      let successCount = 0;
      let lastError = null;
      
      for (const recipient of selectedRecipientsData) {
        try {
          // Call the Supabase function to send email
          const { data, error } = await supabase.functions.invoke('send-test-email', {
            body: {
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              senderName: user.email,
              messageTitle,
              appName: APP_NAME
            }
          });
          
          if (error) throw error;
          
          successCount++;
          setSentCount(prev => prev + 1);
        } catch (err: any) {
          console.error(`Error sending to ${recipient.email}:`, err);
          lastError = err;
          // Continue with other recipients if one fails
        }
      }
      
      if (successCount === 0 && lastError) {
        // If all emails failed, show an error
        setError(lastError.message || "Failed to send test emails. Make sure you have domain verification set up in Resend.");
        toast({
          title: "Error sending emails",
          description: "No test emails could be sent. Check console for details.",
          variant: "destructive"
        });
      } else if (successCount < selectedRecipientsData.length) {
        // Some succeeded but some failed
        toast({
          title: "Partially completed",
          description: `Successfully sent ${successCount} of ${selectedRecipientsData.length} test messages.`,
        });
      } else {
        // All succeeded
        toast({
          title: "Test messages sent",
          description: `Successfully sent ${successCount} of ${selectedRecipientsData.length} test messages.`,
        });
        
        // Close the dialog if all messages were sent successfully
        setTimeout(() => {
          onOpenChange(false);
          resetState();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error in sending test messages:", error);
      setError(error.message || "There was a problem sending the test messages.");
      toast({
        title: "Error",
        description: "There was a problem sending the test messages.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Reset state when dialog closes
  const resetState = () => {
    setSelectedRecipients([]);
    setSentCount(0);
    setHasSendingStarted(false);
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Message</DialogTitle>
          <DialogDescription>
            Send a test email to notify recipients that they've been included in this message.
            No actual message content will be shared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all" 
                checked={selectedRecipients.length === recipients.length} 
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select all recipients
              </Label>
            </div>
            
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {recipients.map(recipient => (
                <div key={recipient.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`recipient-${recipient.id}`} 
                    checked={selectedRecipients.includes(recipient.id)}
                    onCheckedChange={() => handleToggleRecipient(recipient.id)}
                  />
                  <Label htmlFor={`recipient-${recipient.id}`} className="flex-1">
                    <span className="font-medium">{recipient.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {recipient.email}
                    </span>
                  </Label>
                </div>
              ))}
              {recipients.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No recipients available.
                </p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>
                {error}
                {error.includes("domain verification") && (
                  <p className="mt-1">
                    During testing, you can only send to your own verified email address. 
                    To send to other addresses, verify your domain in Resend.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {hasSendingStarted && (
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Progress: {sentCount} of {selectedRecipients.length}
                </span>
                {isSending && <Spinner size="sm" />}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={selectedRecipients.length === 0 || isSending}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            {isSending ? "Sending..." : "Send Test Messages"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
