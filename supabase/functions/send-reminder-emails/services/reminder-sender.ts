
import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * SIMPLIFIED: Orchestrates sending check-in reminders to message creators (email only)
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
      .select('email, first_name')
      .eq('id', creatorUserId)
      .single();
    
    if (profileError || !creatorProfile?.email) {
      console.error("[REMINDER-SENDER] Error fetching creator profile:", profileError);
      results.push({
        success: false,
        recipient: creatorUserId,
        channel: 'email',
        error: `Creator profile not found: ${profileError?.message || 'No email found'}`
      });
      return results;
    }
    
    console.log(`[REMINDER-SENDER] Sending to creator email: ${creatorProfile.email}`);
    
    // SIMPLIFIED: Send only email reminder
    const emailResult = await sendCheckInEmailToCreator(
      creatorProfile.email,
      creatorProfile.first_name || 'User',
      messageTitle,
      messageId,
      hoursUntilDeadline
    );
    
    if (emailResult.success) {
      console.log(`[REMINDER-SENDER] Email reminder sent successfully to ${creatorProfile.email}`);
      results.push({
        success: true,
        recipient: creatorProfile.email,
        channel: 'email',
        messageId: messageId
      });
      
      await reminderLogger.logReminderDelivery(
        `creator-email-${Date.now()}`,
        messageId,
        conditionId,
        creatorProfile.email,
        'email',
        'sent',
        { scheduled_at: scheduledAt }
      );
    } else {
      console.error("[REMINDER-SENDER] Email sending failed:", emailResult.error);
      results.push({
        success: false,
        recipient: creatorProfile.email,
        channel: 'email',
        error: emailResult.error,
        messageId: messageId
      });
      
      await reminderLogger.logReminderDelivery(
        `creator-email-${Date.now()}`,
        messageId,
        conditionId,
        creatorProfile.email,
        'email',
        'failed',
        { scheduled_at: scheduledAt },
        emailResult.error
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
