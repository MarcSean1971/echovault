
import { supabaseClient } from "./supabase-client.ts";
import { sendEmailNotification } from "./email-service.ts";

/**
 * Send a test notification only to the message creator
 * This is specifically used when the Test Reminder button is clicked
 */
export async function sendCreatorTestNotification(messageId: string, debug: boolean = false): Promise<any> {
  try {
    if (debug) console.log(`Sending test notification for message ${messageId} directly to creator`);
    
    const supabase = supabaseClient();
    
    // First get the message details
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("id, title, content, user_id")
      .eq("id", messageId)
      .single();
      
    if (messageError || !messageData) {
      console.error(`Error fetching message ${messageId}:`, messageError);
      return { 
        success: false, 
        error: `Message not found: ${messageError?.message || 'Unknown error'}`
      };
    }
    
    if (!messageData.user_id) {
      console.error(`Message ${messageId} has no creator (user_id)!`);
      return { 
        success: false, 
        error: `Message creator not found`
      };
    }
    
    // Get the creator's information (user profile)
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", messageData.user_id)
      .single();
      
    if (userError || !userData) {
      console.error(`Error fetching user ${messageData.user_id}:`, userError);
      return { 
        success: false, 
        error: `Creator profile not found: ${userError?.message || 'Unknown error'}`
      };
    }
    
    if (!userData.email) {
      console.error(`User ${userData.id} has no email address!`);
      return { 
        success: false, 
        error: `Creator email not found`
      };
    }
    
    // Get the user's name for nice formatting
    const creatorName = userData.first_name || userData.last_name ? 
      `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 
      'Message Creator';
    
    // Track this test notification
    try {
      await supabase.from('message_delivery_log').insert({
        message_id: messageId,
        recipient_id: userData.id,
        delivery_channel: 'email',
        is_test: true,
        status: 'processing',
        metadata: { 
          test_type: 'creator_reminder',
          triggered_at: new Date().toISOString() 
        }
      });
    } catch (trackError) {
      console.warn("Error tracking test notification:", trackError);
      // Non-fatal, continue
    }
    
    // Now send the notification email to the creator
    try {
      // Create simple content for test reminder
      const result = await sendEmailNotification(
        messageId,
        userData.email,
        creatorName,
        creatorName, // sender is also the creator for test
        messageData.title,
        "This is a TEST REMINDER. Please check in to postpone message delivery.",
        {}, // No location data
        false, // Not emergency
        "EchoVault", // App name
        `test-${Date.now()}` // Delivery ID
      );
      
      if (debug) {
        console.log(`Test notification sent to creator (${userData.email}):`, result);
      }
      
      // Update the delivery log
      try {
        await supabase.from('message_delivery_log').insert({
          message_id: messageId,
          recipient_id: userData.id,
          delivery_channel: 'email',
          is_test: true,
          status: result.success ? 'delivered' : 'failed',
          error_message: result.success ? null : (result.error || 'Failed to send test notification'),
          metadata: { 
            completed_at: new Date().toISOString(),
            success: result.success,
            delivery_id: result.deliveryId
          }
        });
      } catch (logError) {
        console.warn("Error updating delivery log:", logError);
      }
      
      return {
        success: result.success,
        message_id: messageId,
        recipient: userData.email,
        recipientName: creatorName,
        method: 'test_notification',
        error: result.success ? null : (result.error || 'Unknown error')
      };
    } catch (error: any) {
      console.error(`Error sending test notification:`, error);
      return { 
        success: false, 
        error: error.message || "Unknown error in sendCreatorTestNotification"
      };
    }
  } catch (error: any) {
    console.error(`Error in sendCreatorTestNotification:`, error);
    return { 
      success: false, 
      error: error.message || "Unknown error in sendCreatorTestNotification"
    };
  }
}
