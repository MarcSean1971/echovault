
import { supabaseClient } from "../supabase-client.ts";
import { sendEmail } from "./email-service.ts";

/**
 * Send a test reminder directly to the message creator
 * This is used when the Test Reminder button is clicked
 */
export async function sendCreatorTestReminder(messageId: string, debug: boolean = false): Promise<any> {
  try {
    if (debug) console.log(`Sending test reminder for message ${messageId} directly to creator`);
    
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
      .select("id, email, first_name, last_name, display_name")
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
    const creatorName = userData.display_name || 
      (userData.first_name || userData.last_name ? 
        `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 
        'Message Creator');
    
    // Fetch the condition for this message (to get remaining time etc)
    const { data: conditionData } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("message_id", messageId)
      .single();
    
    // Calculate hours until deadline (if we have condition data)
    let hoursUntilDeadline = 48; // Default if we don't have condition data
    let checkInDeadline = "your deadline";
    
    if (conditionData) {
      if (conditionData.condition_type === 'no_check_in' || 
          conditionData.condition_type === 'recurring_check_in' || 
          conditionData.condition_type === 'inactivity_to_date') {
        
        // For check-in conditions, calculate virtual deadline from last_checked + threshold
        if (conditionData.last_checked && 
            (conditionData.hours_threshold !== null || conditionData.minutes_threshold !== null)) {
          
          const lastChecked = new Date(conditionData.last_checked);
          const hoursToAdd = conditionData.hours_threshold || 0;
          const minutesToAdd = conditionData.minutes_threshold || 0;
          
          const virtualDeadline = new Date(lastChecked);
          virtualDeadline.setHours(virtualDeadline.getHours() + hoursToAdd);
          virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesToAdd);
          
          const now = new Date();
          hoursUntilDeadline = (virtualDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          // Format the deadline date for display
          checkInDeadline = virtualDeadline.toLocaleString('en-US', { 
            dateStyle: 'full',
            timeStyle: 'short' 
          });
        }
      } else if (conditionData.trigger_date) {
        // For date-based conditions, use the trigger_date
        const deadline = new Date(conditionData.trigger_date);
        const now = new Date();
        hoursUntilDeadline = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        // Format the deadline date for display
        checkInDeadline = deadline.toLocaleString('en-US', { 
          dateStyle: 'full',
          timeStyle: 'short' 
        });
      }
    }
    
    // Track this test reminder in sent_reminders for consistency 
    try {
      await supabase.from('sent_reminders').insert({
        message_id: messageId,
        condition_id: conditionData?.id || 'test-reminder',
        user_id: messageData.user_id,
        deadline: conditionData?.trigger_date || null,
        scheduled_for: new Date().toISOString(),
        notes: "Test reminder"
      });
    } catch (trackError) {
      console.warn("Error tracking test reminder:", trackError);
      // Non-fatal, continue
    }
    
    // Track in reminder_delivery_log too
    const deliveryLogId = `test-reminder-${Date.now()}`;
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: deliveryLogId,
        message_id: messageId,
        condition_id: conditionData?.id || 'test-reminder',
        recipient: userData.email,
        delivery_channel: 'email',
        channel_order: 0,
        delivery_status: 'processing',
        response_data: { 
          creator_id: userData.id,
          type: 'test_reminder' 
        }
      });
    } catch (logError) {
      console.warn("Error logging test reminder:", logError);
      // Non-fatal, continue
    }
    
    // Now send the email to the creator
    const remainingHoursText = hoursUntilDeadline > 0 
      ? `You have approximately ${Math.round(hoursUntilDeadline)} hours remaining until the deadline (${checkInDeadline}).`
      : `The message deadline has passed.`;
      
    const emailSuccess = await sendEmail({
      to: userData.email,
      subject: `Reminder: ${messageData.title} - Check-in Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Message Check-in Reminder</h2>
          <p>Hello ${creatorName},</p>
          <p>This is a <strong>TEST REMINDER</strong> about your message: <strong>${messageData.title}</strong></p>
          <p>${remainingHoursText}</p>
          <p>Please check in to postpone message delivery.</p>
          <div style="margin: 30px 0;">
            <a href="https://echo-vault.app/check-in" 
              style="padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Check In Now
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            This is a test reminder sent from your EchoVault account. 
            If you did not request this test, please contact support.
          </p>
        </div>
      `
    });
    
    // Update the delivery log with the final status
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `${deliveryLogId}-result`,
        message_id: messageId,
        condition_id: conditionData?.id || 'test-reminder',
        recipient: userData.email,
        delivery_channel: 'email',
        channel_order: 999, // Final status
        delivery_status: emailSuccess ? 'delivered' : 'failed',
        error_message: emailSuccess ? null : 'Failed to send test reminder email',
        response_data: { 
          completed_at: new Date().toISOString(),
          success: emailSuccess 
        }
      });
    } catch (logError) {
      console.warn("Error updating test reminder log:", logError);
    }
    
    if (debug) {
      console.log(`Test reminder to ${userData.email} ${emailSuccess ? 'sent successfully' : 'failed'}`);
    }
    
    return {
      success: emailSuccess,
      message_id: messageId,
      recipient: userData.email,
      recipientName: creatorName,
      method: 'test_reminder',
      error: emailSuccess ? null : 'Failed to send email'
    };
  } catch (error: any) {
    console.error(`Error in sendCreatorTestReminder:`, error);
    return { 
      success: false, 
      error: error.message || "Unknown error in sendCreatorTestReminder"
    };
  }
}
