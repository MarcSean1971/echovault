
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Recipient } from "@/types/message";
import { getSenderInfo } from './utils';

/**
 * Notify recipients when they are added to a message
 * Only sends notifications to recipients with notify_on_add=true
 * 
 * @param messageId The ID of the message recipients were added to
 * @param recipients Array of recipient objects
 * @param messageTitle Title of the message
 * @returns Object with success status and counts
 */
export async function notifyRecipientsAddedToMessage(
  messageId: string,
  recipients: Recipient[],
  messageTitle: string
) {
  try {
    // Filter recipients to only those who have opted in to notifications
    const recipientsToNotify = recipients.filter(recipient => recipient.notify_on_add === true);
    
    if (recipientsToNotify.length === 0) {
      // No recipients to notify, but this isn't an error
      return { 
        success: true, 
        totalRecipients: recipients.length,
        notifiedCount: 0 
      };
    }
    
    // Get the sender information
    const { senderName } = await getSenderInfo();
    
    // Send welcome emails to each recipient who opted in
    let successCount = 0;
    let failCount = 0;
    
    for (const recipient of recipientsToNotify) {
      try {
        const { error } = await supabase.functions.invoke("send-test-email", {
          body: {
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            senderName,
            messageTitle,
            appName: "EchoVault",
            isWelcomeEmail: true // Flag to use the welcome email template
          }
        });
        
        if (error) throw error;
        successCount++;
      } catch (err) {
        console.error(`Failed to send welcome email to ${recipient.email}:`, err);
        failCount++;
      }
    }
    
    // Show toast notification about the result
    if (successCount > 0) {
      toast({
        title: "Recipients notified",
        description: `Sent ${successCount} welcome notification${successCount !== 1 ? 's' : ''}`,
      });
    }
    
    return {
      success: successCount > 0,
      totalRecipients: recipients.length,
      notifiedCount: successCount,
      failedCount: failCount
    };
    
  } catch (error: any) {
    console.error("Error notifying new recipients:", error);
    toast({
      title: "Error",
      description: "Failed to send welcome emails to recipients",
      variant: "destructive"
    });
    
    return {
      success: false,
      totalRecipients: recipients.length,
      notifiedCount: 0,
      error: error.message
    };
  }
}
