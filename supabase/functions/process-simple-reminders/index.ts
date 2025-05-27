
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { createReminderSchedule } from "./create-schedule.ts";

console.log("===== SIMPLE REMINDER PROCESSOR =====");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...body } = await req.json();
    
    // Handle schedule creation requests
    if (action === 'create_schedule') {
      console.log("Processing schedule creation request...");
      const success = await createReminderSchedule(body);
      
      return new Response(
        JSON.stringify({
          success,
          message: success ? "Schedule created successfully" : "Failed to create schedule"
        }),
        { 
          status: success ? 200 : 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Default reminder processing logic
    console.log("Processing simple reminders...");
    
    const supabase = supabaseClient();
    
    // Get ALL due reminders from reminder_schedule
    const { data: dueReminders, error } = await supabase
      .from('reminder_schedule')
      .select(`
        id,
        message_id,
        condition_id,
        scheduled_at,
        reminder_type,
        status,
        messages!inner(
          id,
          title,
          user_id,
          content
        ),
        message_conditions!inner(
          id,
          recipients,
          condition_type
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error("Error fetching due reminders:", error);
      throw error;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No due reminders found",
          processedCount: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    let processedCount = 0;
    let successCount = 0;

    // Process each due reminder
    for (const reminder of dueReminders) {
      try {
        console.log(`Processing reminder ${reminder.id}, type: ${reminder.reminder_type}`);
        
        let success = false;
        
        if (reminder.reminder_type === 'reminder') {
          // Send check-in reminder to creator
          success = await sendCheckInReminderToCreator(
            reminder.messages.user_id,
            reminder.messages.title,
            reminder.message_id
          );
        } else if (reminder.reminder_type === 'final_delivery') {
          // Send final message to recipients
          success = await sendFinalMessageToRecipients(
            reminder.message_conditions.recipients,
            reminder.messages.title,
            reminder.messages.content || '',
            reminder.message_id,
            reminder.messages.user_id
          );
        }
        
        // Mark as processed
        const newStatus = success ? 'sent' : 'failed';
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: newStatus,
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', reminder.id);
        
        processedCount++;
        if (success) successCount++;
        
        console.log(`Reminder ${reminder.id} marked as ${newStatus}`);
        
      } catch (error: any) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'failed',
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', reminder.id);
          
        processedCount++;
      }
    }

    console.log(`Processed ${processedCount} reminders, ${successCount} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        successCount,
        failedCount: processedCount - successCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error: any) {
    console.error("Error in simple reminder processor:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

/**
 * Send check-in reminder directly to creator
 */
async function sendCheckInReminderToCreator(
  creatorUserId: string,
  messageTitle: string,
  messageId: string
): Promise<boolean> {
  try {
    console.log(`Sending check-in reminder to creator ${creatorUserId} for message "${messageTitle}"`);
    
    const supabase = supabaseClient();
    
    // Get creator's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, whatsapp_number')
      .eq('id', creatorUserId)
      .single();
    
    if (profileError || !profile?.email) {
      console.error("Creator profile not found:", profileError);
      return false;
    }

    const checkInUrl = `https://echo-vault.app/messages?checkin=${messageId}`;
    let emailSuccess = false;
    let whatsappSuccess = false;

    // Send email reminder
    try {
      emailSuccess = await sendCheckInEmail(
        profile.email,
        profile.first_name || 'User',
        messageTitle,
        checkInUrl
      );
    } catch (error: any) {
      console.error("Error sending check-in email:", error);
    }

    // Send WhatsApp reminder if number available
    if (profile.whatsapp_number) {
      try {
        whatsappSuccess = await sendCheckInWhatsApp(
          profile.whatsapp_number,
          profile.first_name || 'User',
          messageTitle,
          checkInUrl
        );
      } catch (error: any) {
        console.error("Error sending check-in WhatsApp:", error);
      }
    }

    const success = emailSuccess || whatsappSuccess;
    console.log(`Check-in reminder result - Email: ${emailSuccess}, WhatsApp: ${whatsappSuccess}`);
    return success;
    
  } catch (error: any) {
    console.error("Error in sendCheckInReminderToCreator:", error);
    return false;
  }
}

/**
 * Send final message directly to recipients
 */
async function sendFinalMessageToRecipients(
  recipients: any[],
  messageTitle: string,
  messageContent: string,
  messageId: string,
  senderUserId: string
): Promise<boolean> {
  try {
    console.log(`Sending final message "${messageTitle}" to ${recipients?.length || 0} recipients`);
    
    if (!recipients || recipients.length === 0) {
      console.log("No recipients found for final message");
      return true;
    }

    const supabase = supabaseClient();
    
    // Get sender name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', senderUserId)
      .single();
    
    const senderName = senderProfile 
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    let successCount = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        let emailSuccess = false;
        let whatsappSuccess = false;

        // Send email
        if (recipient.email) {
          try {
            emailSuccess = await sendFinalEmail(
              recipient.email,
              recipient.name,
              senderName,
              messageTitle,
              messageContent,
              messageId
            );
          } catch (error: any) {
            console.error(`Error sending final email to ${recipient.email}:`, error);
          }
        }

        // Send WhatsApp
        if (recipient.phone) {
          try {
            whatsappSuccess = await sendFinalWhatsApp(
              recipient.phone,
              recipient.name,
              senderName,
              messageTitle,
              messageContent
            );
          } catch (error: any) {
            console.error(`Error sending final WhatsApp to ${recipient.phone}:`, error);
          }
        }

        if (emailSuccess || whatsappSuccess) {
          successCount++;
        }

      } catch (error: any) {
        console.error(`Error processing recipient ${recipient.name}:`, error);
      }
    }

    const success = successCount > 0;
    console.log(`Final message delivery: ${successCount}/${recipients.length} recipients reached`);
    return success;
    
  } catch (error: any) {
    console.error("Error in sendFinalMessageToRecipients:", error);
    return false;
  }
}

/**
 * Send check-in email directly using Resend
 */
async function sendCheckInEmail(
  email: string,
  firstName: string,
  messageTitle: string,
  checkInUrl: string
): Promise<boolean> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Check-in Required</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8b5cf6;">🔔 Check-in Required</h1>
          <p>Hi ${firstName},</p>
          <p>Your secured message requires a check-in to prevent automatic delivery to recipients.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0; color: #6E59A5;">Message Title</h3>
            <p style="margin: 10px 0 0 0; font-weight: bold;">${messageTitle}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${checkInUrl}" style="background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              ✅ Check In Now
            </a>
          </div>
          
          <p><strong>Important:</strong> If you don't check in before the deadline, your message will be automatically delivered to all recipients.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated reminder from EchoVault</p>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EchoVault <notifications@echo-vault.app>",
        to: [email],
        subject: `🔔 Check-in Required: ${messageTitle}`,
        html: emailContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email API error (${response.status}): ${errorText}`);
    }

    console.log(`Check-in email sent successfully to ${email}`);
    return true;
    
  } catch (error: any) {
    console.error("Check-in email sending error:", error);
    return false;
  }
}

/**
 * Send check-in WhatsApp directly using Twilio
 */
async function sendCheckInWhatsApp(
  phoneNumber: string,
  firstName: string,
  messageTitle: string,
  checkInUrl: string
): Promise<boolean> {
  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      console.log("Twilio credentials not configured");
      return false;
    }

    const whatsappMessage = `🔔 *EchoVault Check-in Reminder*\n\nHi ${firstName}, your message "${messageTitle}" needs a check-in.\n\n✅ Check in now: ${checkInUrl}\n\nIf you don't check in, your message will be delivered automatically.`;

    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${cleanPhone}`,
        Body: whatsappMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error (${response.status}): ${errorText}`);
    }

    console.log(`Check-in WhatsApp sent successfully to ${cleanPhone}`);
    return true;
    
  } catch (error: any) {
    console.error("Check-in WhatsApp sending error:", error);
    return false;
  }
}

/**
 * Send final delivery email directly using Resend
 */
async function sendFinalEmail(
  email: string,
  recipientName: string,
  senderName: string,
  messageTitle: string,
  messageContent: string,
  messageId: string
): Promise<boolean> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const accessUrl = `https://echo-vault.app/access?id=${messageId}&email=${encodeURIComponent(email)}`;

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Secure Message from ${senderName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">EchoVault</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Alert Notification</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">${messageTitle}</h2>
            <p><strong>${senderName}</strong> has sent you a secure message.</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #6E59A5;">What is EchoVault?</h3>
              <p style="margin: 0;">EchoVault is a secure digital vault that ensures important messages and documents reach the right people at the right time.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${accessUrl}" style="background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                View Secure Message
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">If the button doesn't work, copy this link: <br><a href="${accessUrl}">${accessUrl}</a></p>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; margin-top: -1px;">
            <p style="margin: 0; font-size: 14px; color: #666;">© 2025 EchoVault - Secure Message Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EchoVault <notifications@echo-vault.app>",
        to: [email],
        subject: `Alert: ${senderName} sent you a message: "${messageTitle}"`,
        html: emailContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email API error (${response.status}): ${errorText}`);
    }

    console.log(`Final delivery email sent successfully to ${email}`);
    return true;
    
  } catch (error: any) {
    console.error("Final delivery email sending error:", error);
    return false;
  }
}

/**
 * Send final delivery WhatsApp directly using Twilio
 */
async function sendFinalWhatsApp(
  phoneNumber: string,
  recipientName: string,
  senderName: string,
  messageTitle: string,
  messageContent: string
): Promise<boolean> {
  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      console.log("Twilio credentials not configured");
      return false;
    }

    const whatsappMessage = `⚠️ *EMERGENCY ALERT FROM ${senderName.toUpperCase()}*\n\n*${messageTitle}*\n\n${messageContent || "An emergency alert has been triggered."}\n\n${senderName} needs help!\n\nCheck your email for more information.`;

    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${cleanPhone}`,
        Body: whatsappMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error (${response.status}): ${errorText}`);
    }

    console.log(`Final delivery WhatsApp sent successfully to ${cleanPhone}`);
    return true;
    
  } catch (error: any) {
    console.error("Final delivery WhatsApp sending error:", error);
    return false;
  }
}
