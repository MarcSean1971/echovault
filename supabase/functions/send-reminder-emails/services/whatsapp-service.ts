
import { getTwilioCredentials } from "../utils/env.ts";
import { formatDeadlineTime } from "../utils.ts";

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface MessageInfo {
  id: string;
  title: string;
  deadline: string;
  hoursUntil: number;
}

/**
 * Send a WhatsApp reminder for an upcoming message
 */
export async function sendWhatsAppReminder(
  recipient: Recipient,
  message: MessageInfo,
  senderName: string,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recipient.phone) {
      if (debug) {
        console.warn(`No phone number for recipient ${recipient.name}, skipping WhatsApp reminder`);
      }
      return { success: false, error: "No phone number provided" };
    }

    if (debug) {
      console.log(`Sending WhatsApp reminder to ${recipient.phone} for message ${message.id}`);
    }

    // Get Twilio credentials
    const { accountSid, authToken } = getTwilioCredentials();
    
    // Format phone number to ensure proper format (remove whatsapp: prefix if it exists)
    const formattedPhone = recipient.phone.replace("whatsapp:", "");
    const cleanPhone = formattedPhone.startsWith('+') ? 
      formattedPhone : 
      `+${formattedPhone.replace(/\D/g, '')}`;
    
    // Format deadline time for display
    const deadlineTime = formatDeadlineTime(message.deadline);
    
    // Prepare the reminder message
    const reminderMessage = `🔔 REMINDER: A message from ${senderName} titled "${message.title}" is scheduled to be delivered in about ${message.hoursUntil} hours (${deadlineTime}) unless disarmed. Please check your email or log in to take action.`;
    
    if (debug) {
      console.log(`WhatsApp message content: ${reminderMessage}`);
      console.log(`Sending to: ${cleanPhone}`);
    }
    
    // Create the payload for Twilio
    const payload = new URLSearchParams({
      To: `whatsapp:${cleanPhone}`,
      From: 'whatsapp:+14155238886', // Twilio sandbox number
      Body: reminderMessage
    });
    
    // Send the message through Twilio API
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });
    
    // Get the response
    const responseText = await response.text();
    
    if (debug) {
      console.log(`WhatsApp response status: ${response.status}`);
      console.log(`WhatsApp response: ${responseText}`);
    }
    
    // Parse the response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      if (debug) {
        console.error("Error parsing WhatsApp response:", error);
      }
      responseData = { rawResponse: responseText };
    }
    
    // Check for success
    if (response.ok) {
      if (debug) {
        console.log(`WhatsApp reminder sent successfully to ${cleanPhone}`);
      }
      return { success: true };
    } else {
      const errorMessage = responseData.message || responseData.error_message || "Unknown WhatsApp error";
      if (debug) {
        console.error(`WhatsApp error: ${errorMessage}`);
      }
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error(`Error sending WhatsApp reminder:`, error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
