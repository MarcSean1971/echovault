
import { supabaseClient } from "./supabase-client.ts";

export async function sendFinalMessageToRecipients(
  recipients: any[],
  messageTitle: string,
  messageContent: string,
  messageId: string
): Promise<boolean> {
  try {
    console.log(`Sending final message "${messageTitle}" to ${recipients?.length || 0} recipients`);
    
    if (!recipients || recipients.length === 0) {
      console.log("No recipients found for final message");
      return true; // Not an error, just no recipients
    }
    
    const supabase = supabaseClient();
    
    // Send final message using existing notification service
    const { error: notificationError } = await supabase.functions.invoke('send-message-notifications', {
      body: {
        messageId: messageId,
        debug: true,
        forceSend: true,
        source: "simple_final_delivery"
      }
    });
    
    if (notificationError) {
      console.error("Error sending final message:", notificationError);
      return false;
    }
    
    console.log(`Final message sent successfully to recipients`);
    return true;
    
  } catch (error: any) {
    console.error("Error in sendFinalMessageToRecipients:", error);
    return false;
  }
}
