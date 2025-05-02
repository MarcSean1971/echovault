
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
import { toast } from "@/components/ui/use-toast";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RecipientSelector } from "./test-notification/RecipientSelector";
import { SendingProgress } from "./test-notification/SendingProgress";

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
          <RecipientSelector
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            setSelectedRecipients={setSelectedRecipients}
          />

          <SendingProgress
            hasSendingStarted={hasSendingStarted}
            isSending={isSending}
            sentCount={sentCount}
            totalCount={selectedRecipients.length}
            error={error}
          />
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
