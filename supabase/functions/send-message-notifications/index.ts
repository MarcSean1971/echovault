import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { supabaseClient } from "./supabase-client.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessageNotificationRequest {
  messageId?: string; // Optional - if provided, only check this specific message
}

interface Message {
  id: string;
  title: string;
  content: string | null;
  message_type: string;
  attachments: Array<{
    path: string;
    name: string;
    size: number;
    type: string;
  }> | null;
  user_id: string;
}

interface Condition {
  id: string;
  message_id: string;
  condition_type: string;
  active: boolean;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  pin_code?: string;
  unlock_delay_hours?: number;
  expiry_hours?: number;
  trigger_date?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the message ID if provided in the request body
    const requestData: MessageNotificationRequest = await req.json().catch(() => ({}));
    const { messageId } = requestData;
    
    console.log(`Processing message notifications${messageId ? ` for message ID: ${messageId}` : ''}`);

    // Get messages that need notification
    const messagesToNotify = await getMessagesToNotify(messageId);
    console.log(`Found ${messagesToNotify.length} messages to notify`);

    // Send notifications for each message
    const results = await Promise.all(messagesToNotify.map(sendMessageNotification));
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages_processed: messagesToNotify.length,
        successful_notifications: successful,
        failed_notifications: failed
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-message-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function getMessagesToNotify(specificMessageId?: string): Promise<Array<{message: Message, condition: Condition}>> {
  const supabase = supabaseClient();
  
  // Start building the query
  let query = supabase
    .from('message_conditions')
    .select(`
      *,
      messages:message_id (
        id, title, content, message_type, attachments, user_id
      )
    `)
    .eq('active', true); // Only get active conditions
  
  if (specificMessageId) {
    // If a specific message ID is provided, only get that one - this is important for panic triggers
    query = query.eq('message_id', specificMessageId);
  } else {
    // Otherwise, get messages due for delivery based on trigger conditions
    // Include panic_trigger in the list of conditions to check
    query = query.or('trigger_date.lte.now(),condition_type.eq.inactivity_to_date,condition_type.eq.no_check_in,condition_type.eq.panic_trigger');
  }
  
  const { data: conditions, error } = await query;
  
  if (error) {
    console.error("Error fetching messages to notify:", error);
    throw error;
  }
  
  // Filter and map the conditions to return both message and condition information
  return (conditions || [])
    .filter(condition => condition.messages) // Ensure the message exists
    .map(condition => ({
      message: condition.messages as unknown as Message,
      condition: {
        id: condition.id,
        message_id: condition.message_id,
        condition_type: condition.condition_type,
        active: condition.active,
        recipients: condition.recipients as any[],
        pin_code: condition.pin_code,
        unlock_delay_hours: condition.unlock_delay_hours,
        expiry_hours: condition.expiry_hours,
        trigger_date: condition.trigger_date
      }
    }));
}

async function sendMessageNotification(data: {message: Message, condition: Condition}) {
  const { message, condition } = data;
  
  // Skip if no recipients
  if (!condition.recipients || condition.recipients.length === 0) {
    console.log(`No recipients for message ${message.id}, skipping notification`);
    return { success: true, message: "No recipients to notify" };
  }
  
  try {
    // Check if this is an emergency/panic message for special handling
    const isEmergencyMessage = condition.condition_type === 'panic_trigger';
    
    // Determine security settings
    const hasPinCode = !!condition.pin_code;
    const hasDelayedAccess = (condition.unlock_delay_hours || 0) > 0;
    const hasExpiry = (condition.expiry_hours || 0) > 0;
    
    // Calculate dates for delay and expiry if applicable
    const now = new Date();
    const unlockDate = hasDelayedAccess 
      ? new Date(now.getTime() + (condition.unlock_delay_hours || 0) * 60 * 60 * 1000) 
      : now;
    const expiryDate = hasExpiry 
      ? new Date(now.getTime() + (condition.expiry_hours || 0) * 60 * 60 * 1000) 
      : null;
    
    // Create access link based on security settings
    const baseUrl = "https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1";
    
    // Track the notifications in the database
    await trackMessageNotification(message.id, condition.id);
    
    // For emergency messages, attempt multiple deliveries with retry
    const maxRetries = isEmergencyMessage ? 3 : 1;
    const retryDelay = 5000; // 5 seconds between retries for emergency messages
    
    // Send a notification to each recipient with retry for emergencies
    await Promise.all(condition.recipients.map(async (recipient) => {
      let attempt = 0;
      let success = false;
      
      // Create a unique delivery ID for this recipient
      const deliveryId = crypto.randomUUID();
      
      // Create secure access URL with delivery tracking
      const secureAccessUrl = `${baseUrl}/${message.id}?recipient=${encodeURIComponent(recipient.email)}&delivery=${deliveryId}`;
      
      // Prepare common email data
      const emailData = {
        senderName: "EchoVault", // You could fetch the actual user's name here
        messageTitle: message.title,
        recipientName: recipient.name,
        messageType: message.message_type,
        hasPinCode: hasPinCode,
        hasDelayedAccess: hasDelayedAccess,
        hasExpiry: hasExpiry,
        unlockDate: hasDelayedAccess ? new Date(unlockDate).toISOString() : null,
        expiryDate: hasExpiry ? new Date(expiryDate!).toISOString() : null,
        accessUrl: secureAccessUrl,
        isEmergency: isEmergencyMessage
      };
      
      // Record the message delivery
      await recordMessageDelivery(message.id, condition.id, recipient.id, deliveryId);
      
      // Try sending with retry for emergency messages
      while (!success && attempt < maxRetries) {
        try {
          // Send email notification
          await sendEmailToRecipient(recipient.email, emailData);
          success = true;
        } catch (error) {
          attempt++;
          console.error(`Error sending email to ${recipient.email} (attempt ${attempt}):`, error);
          if (attempt < maxRetries) {
            // Only wait and retry if we have attempts remaining
            console.log(`Retrying in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      return success;
    }));
    
    // Only mark the condition as inactive if it's not a panic trigger with keep_armed=true
    // For panic triggers, we need to check the panic_config to see if keep_armed is true
    if (condition.condition_type !== 'recurring_check_in') {
      // Fetch the full condition to check panic_config if needed
      if (condition.condition_type === 'panic_trigger') {
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('message_conditions')
          .select('panic_config')
          .eq('id', condition.id)
          .single();
          
        if (error) {
          console.error("Error checking panic_config:", error);
        } else {
          // Only deactivate if keep_armed is false or not specified
          const keepArmed = data?.panic_config?.keep_armed || false;
          
          if (!keepArmed) {
            // For non-recurring conditions that don't have keep_armed=true, mark as inactive after delivery
            await updateConditionStatus(condition.id, false);
          }
        }
      } else {
        // For all other non-recurring conditions, mark as inactive after delivery
        await updateConditionStatus(condition.id, false);
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error notifying recipients for message ${message.id}:`, error);
    return { success: false, error: error.message };
  }
}

async function trackMessageNotification(messageId: string, conditionId: string) {
  const supabase = supabaseClient();
  
  const { error } = await supabase
    .from('sent_reminders')
    .insert({
      message_id: messageId,
      condition_id: conditionId,
      sent_at: new Date().toISOString(),
      deadline: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now as default
    });
  
  if (error) {
    console.error("Error tracking message notification:", error);
    throw error;
  }
}

async function recordMessageDelivery(messageId: string, conditionId: string, recipientId: string, deliveryId: string) {
  const supabase = supabaseClient();
  
  try {
    // Check if we have a delivered_messages table
    const { error } = await supabase
      .from('delivered_messages')
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        recipient_id: recipientId,
        delivery_id: deliveryId,
        delivered_at: new Date().toISOString()
      });
    
    if (error) {
      // If the table doesn't exist, just log and continue - this isn't critical
      console.warn("Could not record message delivery (table may not exist):", error);
    }
  } catch (error) {
    // Don't let delivery recording failure stop the process
    console.warn("Error recording message delivery:", error);
  }
}

async function updateConditionStatus(conditionId: string, active: boolean) {
  const supabase = supabaseClient();
  
  const { error } = await supabase
    .from('message_conditions')
    .update({ active })
    .eq('id', conditionId);
  
  if (error) {
    console.error("Error updating condition status:", error);
    throw error;
  }
}

async function sendEmailToRecipient(
  recipientEmail: string, 
  data: {
    senderName: string;
    messageTitle: string;
    recipientName: string;
    messageType: string;
    hasPinCode: boolean;
    hasDelayedAccess: boolean;
    hasExpiry: boolean;
    unlockDate: string | null;
    expiryDate: string | null;
    accessUrl: string;
    isEmergency?: boolean;
  }
) {
  // Generate the appropriate email template based on security settings and message type
  const template = generateEmailTemplate(data);
  
  // For emergency messages, add urgent flags in the subject
  const subject = data.isEmergency
    ? `⚠️ URGENT EMERGENCY MESSAGE: "${data.messageTitle}"`
    : `Secure Message: "${data.messageTitle}" is now available`;
  
  // Send the email using Resend
  const emailResponse = await resend.emails.send({
    from: `EchoVault <noreply@resend.dev>`,
    to: [recipientEmail],
    subject: subject,
    html: template,
    // For emergency messages, set high priority
    headers: data.isEmergency ? {
      'X-Priority': '1',
      'Importance': 'high'
    } : undefined
  });
  
  if (emailResponse.error) {
    console.error("Error sending email:", emailResponse.error);
    throw new Error(`Failed to send email: ${emailResponse.error.message}`);
  }
  
  return emailResponse;
}

function generateEmailTemplate(data: {
  senderName: string;
  messageTitle: string;
  recipientName: string;
  messageType: string;
  hasPinCode: boolean;
  hasDelayedAccess: boolean;
  hasExpiry: boolean;
  unlockDate: string | null;
  expiryDate: string | null;
  accessUrl: string;
  isEmergency?: boolean;
}): string {
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Security notes based on message settings
  const securityNotes = [];
  
  if (data.hasPinCode) {
    securityNotes.push(`
      <div class="security-note">
        <strong>PIN Protected:</strong> You will need a PIN code to view this message. Please contact the sender if you haven't received this PIN.
      </div>
    `);
  }
  
  if (data.hasDelayedAccess) {
    securityNotes.push(`
      <div class="security-note">
        <strong>Delayed Access:</strong> This message will become available for viewing on ${formatDate(data.unlockDate)}.
      </div>
    `);
  }
  
  if (data.hasExpiry) {
    securityNotes.push(`
      <div class="security-note">
        <strong>Message Expiration:</strong> This message will expire and no longer be accessible after ${formatDate(data.expiryDate)}.
      </div>
    `);
  }
  
  // Different message type descriptions
  let contentTypeDescription = 'text message';
  if (data.messageType === 'voice') {
    contentTypeDescription = 'voice recording';
  } else if (data.messageType === 'video') {
    contentTypeDescription = 'video message';
  }
  
  // Emergency styling
  const headerStyle = data.isEmergency 
    ? `background-color: #e11d48; color: white;` 
    : `background-color: #2563eb; color: white;`;
  
  const buttonStyle = data.isEmergency
    ? `background-color: #e11d48; color: white;`
    : `background-color: #2563eb; color: white;`;
  
  // Emergency warning content
  const emergencyWarning = data.isEmergency
    ? `
      <div style="background-color: #fee2e2; border-left: 4px solid #e11d48; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="color: #e11d48; margin-top: 0;">⚠️ EMERGENCY NOTICE</h3>
        <p>This message was triggered as an <strong>emergency alert</strong> and requires your immediate attention.</p>
      </div>
    `
    : '';
  
  // Main email template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${data.isEmergency ? 'EMERGENCY MESSAGE' : 'Secure Message Notification'}</title>
      <style>
        body {
          font-family: sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          ${headerStyle}
          padding: 20px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 0;
        }
        .content {
          background-color: #f8fafc;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
        }
        .button {
          ${buttonStyle}
          padding: 12px 20px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          margin: 20px 0;
          font-weight: bold;
        }
        .security-note {
          background-color: #fef9c3;
          border-left: 4px solid #eab308;
          padding: 12px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .footer {
          font-size: 12px;
          color: #6b7280;
          margin-top: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">EchoVault</div>
        <p>${data.isEmergency ? 'EMERGENCY MESSAGE' : 'Secure Message Notification'}</p>
      </div>
      
      <div class="content">
        <h2>Hello ${data.recipientName},</h2>
        
        ${emergencyWarning}
        
        <p>A secure ${contentTypeDescription} titled "<strong>${data.messageTitle}</strong>" from ${data.senderName} is now available for you to access.</p>
        
        ${securityNotes.join('')}
        
        <a href="${data.accessUrl}" class="button">Access Secure Message</a>
        
        <p>If you're unable to click the button above, copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all; font-size: 12px;">${data.accessUrl}</p>
        
        <div class="footer">
          <p>This email was sent securely from EchoVault.</p>
          <p>For security reasons, this link is unique to you and should not be shared.</p>
          <p>&copy; ${new Date().getFullYear()} EchoVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
