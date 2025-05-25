
import { supabaseClient } from "../supabase-client.ts";
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * Send a test reminder notification to the message creator
 */
export async function sendCreatorTestNotification(
  messageId: string,
  debug: boolean = false
): Promise<{ success: boolean; recipient?: string; error?: string; messageId?: string }> {
  const supabase = supabaseClient();
  
  try {
    console.log(`[TEST-REMINDER] Sending test notification for message ${messageId}`);
    
    // Get message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, title, user_id')
      .eq('id', messageId)
      .single();
      
    if (messageError || !message) {
      return {
        success: false,
        error: `Message not found: ${messageError?.message || 'Unknown error'}`,
        messageId: messageId
      };
    }
    
    // Get creator's profile
    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, whatsapp_number')
      .eq('id', message.user_id)
      .single();
    
    if (profileError || !creatorProfile) {
      return {
        success: false,
        error: `Creator profile not found: ${profileError?.message || 'Unknown error'}`,
        messageId: messageId
      };
    }
    
    // Generate check-in URL
    const checkInUrl = generateCheckInUrl(messageId);
    
    // Prepare test reminder data
    const testReminderData = {
      recipientName: creatorProfile.first_name || 'User',
      recipientEmail: creatorProfile.email,
      messageTitle: message.title,
      hoursUntilDeadline: 24, // Default test value
      scheduledAt: new Date().toISOString(),
      checkInUrl: checkInUrl,
      messageId: messageId,
      debug: debug,
      isTest: true
    };
    
    console.log(`[TEST-REMINDER] Test reminder data:`, {
      recipient: creatorProfile.email,
      messageTitle: message.title,
      checkInUrl: checkInUrl,
      isTest: true
    });
    
    // Send test email
    const { error: emailError } = await supabase.functions.invoke('send-reminder-emails', {
      body: {
        action: 'send-test-reminder',
        reminderData: testReminderData
      }
    });
    
    if (emailError) {
      console.error("[TEST-REMINDER] Test email sending error:", emailError);
      return {
        success: false,
        recipient: creatorProfile.email,
        error: `Test email sending failed: ${emailError.message}`,
        messageId: messageId
      };
    }
    
    console.log(`[TEST-REMINDER] Test reminder sent successfully to ${creatorProfile.email}`);
    return {
      success: true,
      recipient: creatorProfile.email,
      messageId: messageId
    };
    
  } catch (error: any) {
    console.error("[TEST-REMINDER] Critical error in sendCreatorTestNotification:", error);
    return {
      success: false,
      error: `Critical error: ${error.message}`,
      messageId: messageId
    };
  }
}
