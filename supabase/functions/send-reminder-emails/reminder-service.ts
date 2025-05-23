
import { supabaseClient } from "./supabase-client.ts";

/**
 * Process a single reminder
 * This is a temporary stub for testing purposes
 */
export async function processReminder(reminder: any, debug: boolean = false): Promise<any> {
  try {
    if (debug) {
      console.log(`Processing reminder ${reminder.id} for message ${reminder.message_id}`);
    }
    
    const supabase = supabaseClient();
    
    // Get the message and condition details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', reminder.message_id)
      .single();
    
    if (messageError) {
      console.error(`Error fetching message ${reminder.message_id}:`, messageError);
      return { 
        success: false, 
        error: `Error fetching message: ${messageError.message}`,
        results: []
      };
    }
    
    // Get user details to send notification
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', message.user_id)
      .single();
      
    if (userError) {
      console.error(`Error fetching user ${message.user_id}:`, userError);
      return { 
        success: false, 
        error: `Error fetching user: ${userError.message}`,
        results: []
      };
    }
    
    if (!userData.email) {
      return { 
        success: false, 
        error: `User ${userData.id} has no email address`,
        results: []
      };
    }
    
    // For testing, we'll just return a success message without actually sending an email
    // In a real implementation, we'd send an email here
    console.log(`[REMINDER] Would send email to: ${userData.email} for message: ${message.title}`);
    
    // Use the send-message-notifications function to send an actual notification
    try {
      const { data, error } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: reminder.message_id,
          debug: true,
          forceSend: true,
          testMode: true,
          source: "reminder-test-trigger"
        }
      });
      
      if (error) {
        console.error("Error invoking send-message-notifications:", error);
        return { 
          success: false, 
          error: `Failed to send notification: ${error.message}`,
          results: []
        };
      }
      
      console.log("Notification function response:", data);
      
      return {
        success: true,
        results: [{
          recipient: userData.email,
          recipientId: userData.id,
          messageId: message.id,
          status: "delivered"
        }]
      };
    } catch (notificationError: any) {
      console.error("Error sending notification:", notificationError);
      return { 
        success: false, 
        error: `Notification error: ${notificationError.message}`,
        results: []
      };
    }
  } catch (error: any) {
    console.error(`Error processing reminder:`, error);
    return { 
      success: false, 
      error: error.message || "Unknown error",
      results: []
    };
  }
}
