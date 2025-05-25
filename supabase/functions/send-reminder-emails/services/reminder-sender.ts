
import { supabaseClient } from "../supabase-client.ts";
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * SIMPLIFIED: Send check-in reminder ONLY to message creator
 * This function now ONLY sends reminders to creators, not recipients
 */
export async function sendCreatorReminder(
  messageId: string,
  conditionId: string,
  messageTitle: string,
  creatorUserId: string,
  hoursUntilDeadline: number,
  scheduledAt: string,
  debug: boolean = false
): Promise<Array<{ success: boolean; recipient: string; channel: string; error?: string; messageId?: string }>> {
  const supabase = supabaseClient();
  const results: Array<{ success: boolean; recipient: string; channel: string; error?: string; messageId?: string }> = [];
  
  try {
    console.log(`[REMINDER-SENDER] Sending check-in reminder to creator ${creatorUserId} for message ${messageId}`);
    
    // Get creator's profile information
    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, whatsapp_number')
      .eq('id', creatorUserId)
      .single();
    
    if (profileError || !creatorProfile) {
      console.error("[REMINDER-SENDER] Error fetching creator profile:", profileError);
      results.push({
        success: false,
        recipient: creatorUserId,
        channel: 'email',
        error: `Creator profile not found: ${profileError?.message || 'Unknown error'}`
      });
      return results;
    }
    
    // Generate check-in URL
    const checkInUrl = generateCheckInUrl(messageId);
    
    // Prepare reminder data
    const reminderData = {
      recipientName: creatorProfile.first_name || 'User',
      recipientEmail: creatorProfile.email,
      messageTitle: messageTitle,
      hoursUntilDeadline: Math.max(0, hoursUntilDeadline),
      scheduledAt: scheduledAt,
      checkInUrl: checkInUrl,
      messageId: messageId,
      debug: debug
    };
    
    console.log(`[REMINDER-SENDER] Reminder data prepared:`, {
      recipient: creatorProfile.email,
      messageTitle: messageTitle,
      hoursUntilDeadline: reminderData.hoursUntilDeadline,
      checkInUrl: checkInUrl
    });
    
    // Send email reminder
    try {
      const { error: emailError } = await supabase.functions.invoke('send-reminder-emails', {
        body: {
          action: 'send-creator-reminder',
          reminderData: reminderData
        }
      });
      
      if (emailError) {
        console.error("[REMINDER-SENDER] Email sending error:", emailError);
        results.push({
          success: false,
          recipient: creatorProfile.email,
          channel: 'email',
          error: `Email sending failed: ${emailError.message}`,
          messageId: messageId
        });
      } else {
        console.log(`[REMINDER-SENDER] Email reminder sent successfully to ${creatorProfile.email}`);
        results.push({
          success: true,
          recipient: creatorProfile.email,
          channel: 'email',
          messageId: messageId
        });
      }
    } catch (emailError: any) {
      console.error("[REMINDER-SENDER] Email sending exception:", emailError);
      results.push({
        success: false,
        recipient: creatorProfile.email,
        channel: 'email',
        error: `Email sending exception: ${emailError.message}`,
        messageId: messageId
      });
    }
    
    // Send WhatsApp reminder if WhatsApp number is available
    if (creatorProfile.whatsapp_number) {
      try {
        const whatsappMessage = `🔔 *EchoVault Reminder*\n\nYour message "${messageTitle}" needs a check-in.\n\n⏰ Time until deadline: ${Math.max(0, hoursUntilDeadline).toFixed(1)} hours\n\n✅ Check in now: ${checkInUrl}`;
        
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-notification', {
          body: {
            to: creatorProfile.whatsapp_number,
            message: whatsappMessage,
            messageId: messageId,
            source: 'check-in-reminder'
          }
        });
        
        if (whatsappError) {
          console.error("[REMINDER-SENDER] WhatsApp sending error:", whatsappError);
          results.push({
            success: false,
            recipient: creatorProfile.whatsapp_number,
            channel: 'whatsapp',
            error: `WhatsApp sending failed: ${whatsappError.message}`,
            messageId: messageId
          });
        } else {
          console.log(`[REMINDER-SENDER] WhatsApp reminder sent successfully to ${creatorProfile.whatsapp_number}`);
          results.push({
            success: true,
            recipient: creatorProfile.whatsapp_number,
            channel: 'whatsapp',
            messageId: messageId
          });
        }
      } catch (whatsappError: any) {
        console.error("[REMINDER-SENDER] WhatsApp sending exception:", whatsappError);
        results.push({
          success: false,
          recipient: creatorProfile.whatsapp_number,
          channel: 'whatsapp',
          error: `WhatsApp sending exception: ${whatsappError.message}`,
          messageId: messageId
        });
      }
    } else {
      console.log(`[REMINDER-SENDER] No WhatsApp number for creator ${creatorUserId}`);
    }
    
    return results;
    
  } catch (error: any) {
    console.error("[REMINDER-SENDER] Critical error in sendCreatorReminder:", error);
    results.push({
      success: false,
      recipient: creatorUserId,
      channel: 'system',
      error: `Critical error: ${error.message}`,
      messageId: messageId
    });
    return results;
  }
}
