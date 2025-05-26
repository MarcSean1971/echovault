
import { supabaseClient } from "../supabase-client.ts";
import { generateCheckInUrl } from "../utils/url-generator.ts";

/**
 * FIXED: Send check-in reminder ONLY to message creator with both email and WhatsApp
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
    
    // Generate check-in URL
    const checkInUrl = generateCheckInUrl(messageId);
    
    console.log(`[REMINDER-SENDER] Sending to creator email: ${user.email}, WhatsApp: ${creatorProfile.whatsapp_number || 'none'}`);
    
    // FIXED: Send email reminder directly using Resend API
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY not configured");
      }

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔔 Check-in Reminder</h2>
          <p>Hi ${creatorProfile.first_name || 'User'},</p>
          <p>Your message "<strong>${messageTitle}</strong>" needs a check-in.</p>
          <p><strong>Time until deadline:</strong> ${Math.max(0, hoursUntilDeadline).toFixed(1)} hours</p>
          <div style="margin: 20px 0;">
            <a href="${checkInUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">✅ Check In Now</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you don't check in before the deadline, your message will be delivered to recipients.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">This is an automated reminder from EchoVault.</p>
        </div>
      `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EchoVault <noreply@resend.dev>",
          to: [user.email],
          subject: `🔔 Check-in Required: ${messageTitle}`,
          html: emailContent,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Email API error: ${errorText}`);
      }

      console.log(`[REMINDER-SENDER] Email reminder sent successfully to ${user.email}`);
      results.push({
        success: true,
        recipient: user.email,
        channel: 'email',
        messageId: messageId
      });
    } catch (emailError: any) {
      console.error("[REMINDER-SENDER] Email sending error:", emailError);
      results.push({
        success: false,
        recipient: user.email,
        channel: 'email',
        error: `Email sending failed: ${emailError.message}`,
        messageId: messageId
      });
    }
    
    // Send WhatsApp reminder if WhatsApp number is available
    if (creatorProfile.whatsapp_number) {
      try {
        const whatsappMessage = `🔔 *EchoVault Check-in Reminder*\n\nYour message "${messageTitle}" needs a check-in.\n\n⏰ Time until deadline: ${Math.max(0, hoursUntilDeadline).toFixed(1)} hours\n\n✅ Check in now: ${checkInUrl}`;
        
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
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
    
    // Log event for frontend monitoring
    const hasSuccess = results.some(result => result.success);
    if (hasSuccess) {
      console.log(`[REMINDER-SENDER] Emitting conditions-updated event for message ${messageId}`);
      
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: `creator-reminder-${Date.now()}`,
          message_id: messageId,
          condition_id: conditionId,
          recipient: 'creator',
          delivery_channel: 'reminder',
          delivery_status: 'completed',
          response_data: { 
            event_type: 'check-in-reminder-sent',
            action: 'reminder-sent-to-creator',
            source: 'reminder-sender',
            timestamp: new Date().toISOString(),
            messageId: messageId,
            conditionId: conditionId,
            email_sent: results.some(r => r.channel === 'email' && r.success),
            whatsapp_sent: results.some(r => r.channel === 'whatsapp' && r.success)
          }
        });
      } catch (eventError) {
        console.error("[REMINDER-SENDER] Error logging event:", eventError);
      }
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
