
import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { sendCheckInWhatsAppToCreator } from "./whatsapp-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * Orchestrates sending check-in reminders to message creators
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

    // Get creator's email from auth system
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(creatorUserId);
    if (userError || !user?.email) {
      console.error("[REMINDER-SENDER] Error fetching creator email:", userError);
      results.push({
        success: false,
        recipient: creatorUserId,
        channel: 'email',
        error: `Creator email not found: ${userError?.message || 'Unknown error'}`
      });
      return results;
    }
    
    console.log(`[REMINDER-SENDER] Sending to creator email: ${user.email}, WhatsApp: ${creatorProfile.whatsapp_number || 'none'}`);
    
    // Send email reminder
    const emailResult = await sendCheckInEmailToCreator(
      user.email,
      creatorProfile.first_name,
      messageTitle,
      messageId,
      hoursUntilDeadline
    );
    
    if (emailResult.success) {
      console.log(`[REMINDER-SENDER] Email reminder sent successfully to ${user.email}`);
      results.push({
        success: true,
        recipient: user.email,
        channel: 'email',
        messageId: messageId
      });
      
      await reminderLogger.logReminderDelivery(
        `creator-email-${Date.now()}`,
        messageId,
        conditionId,
        user.email,
        'email',
        'sent',
        { scheduled_at: scheduledAt }
      );
    } else {
      console.error("[REMINDER-SENDER] Email sending failed:", emailResult.error);
      results.push({
        success: false,
        recipient: user.email,
        channel: 'email',
        error: emailResult.error,
        messageId: messageId
      });
      
      await reminderLogger.logReminderDelivery(
        `creator-email-${Date.now()}`,
        messageId,
        conditionId,
        user.email,
        'email',
        'failed',
        { scheduled_at: scheduledAt },
        emailResult.error
      );
    }
    
    // Send WhatsApp reminder if WhatsApp number is available
    if (creatorProfile.whatsapp_number) {
      const whatsappResult = await sendCheckInWhatsAppToCreator(
        creatorProfile.whatsapp_number,
        messageTitle,
        messageId,
        hoursUntilDeadline
      );
      
      if (whatsappResult.success) {
        console.log(`[REMINDER-SENDER] WhatsApp reminder sent successfully to ${creatorProfile.whatsapp_number}`);
        results.push({
          success: true,
          recipient: creatorProfile.whatsapp_number,
          channel: 'whatsapp',
          messageId: messageId
        });
        
        await reminderLogger.logReminderDelivery(
          `creator-whatsapp-${Date.now()}`,
          messageId,
          conditionId,
          creatorProfile.whatsapp_number,
          'whatsapp',
          'sent',
          { scheduled_at: scheduledAt }
        );
      } else {
        console.error("[REMINDER-SENDER] WhatsApp sending failed:", whatsappResult.error);
        results.push({
          success: false,
          recipient: creatorProfile.whatsapp_number,
          channel: 'whatsapp',
          error: whatsappResult.error,
          messageId: messageId
        });
        
        await reminderLogger.logReminderDelivery(
          `creator-whatsapp-${Date.now()}`,
          messageId,
          conditionId,
          creatorProfile.whatsapp_number,
          'whatsapp',
          'failed',
          { scheduled_at: scheduledAt },
          whatsappResult.error
        );
      }
    } else {
      console.log(`[REMINDER-SENDER] No WhatsApp number for creator ${creatorUserId}`);
    }
    
    // Log event for frontend monitoring
    const hasSuccess = results.some(result => result.success);
    if (hasSuccess) {
      await reminderLogger.logSystemEvent(
        'check-in-reminder-sent',
        messageId,
        conditionId,
        {
          action: 'reminder-sent-to-creator',
          source: 'reminder-sender',
          email_sent: results.some(r => r.channel === 'email' && r.success),
          whatsapp_sent: results.some(r => r.channel === 'whatsapp' && r.success)
        }
      );
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
