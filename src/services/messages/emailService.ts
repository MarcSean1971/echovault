
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface TestEmailResult {
  success: boolean;
  successCount: number;
  totalCount: number;
  error?: any;
}

/**
 * Send test emails to selected recipients
 */
export async function sendTestEmailsToRecipients(
  recipients: { name: string; email: string }[],
  senderName: string,
  messageTitle: string,
): Promise<TestEmailResult> {
  const APP_NAME = "EchoVault";
  let successCount = 0;
  let lastError = null;
  
  for (const recipient of recipients) {
    try {
      // Call the Supabase function to send email
      const { error } = await supabase.functions.invoke('send-test-email', {
        body: {
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          senderName,
          messageTitle,
          appName: APP_NAME
        }
      });
      
      if (error) throw error;
      
      successCount++;
    } catch (err: any) {
      console.error(`Error sending to ${recipient.email}:`, err);
      lastError = err;
      // Continue with other recipients if one fails
    }
  }
  
  // Return the results
  return {
    success: successCount > 0,
    successCount,
    totalCount: recipients.length,
    error: lastError
  };
}
