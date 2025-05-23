
import { supabaseClient } from "../supabase-client.ts";
import { formatWhatsAppNumber } from "../utils/phone-formatter.ts";

/**
 * Send a WhatsApp message for a reminder using the check-in template
 * 
 * @param recipient Information about the recipient (must include phone)
 * @param message Message details
 * @param details Additional details like deadline and URL
 * @returns Success status and any error message
 */
export async function sendWhatsApp(
  recipient: { phone?: string; name: string; firstName?: string },
  message: { 
    id: string; 
    title: string; 
    user_id: string;
  },
  details: {
    timeUntilDeadline: string;
    appUrl: string;
    debug?: boolean;
  }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const { debug = false } = details;
  
  try {
    if (!recipient.phone) {
      if (debug) console.log(`No phone number for recipient ${recipient.name}, skipping WhatsApp`);
      return { success: false, error: "No phone number provided" };
    }
    
    if (debug) console.log(`[WhatsApp] Sending check-in reminder to ${recipient.phone}`);
    
    // Format phone number to ensure proper format
    const formattedPhone = formatWhatsAppNumber(recipient.phone);
    
    // Initialize Supabase client
    const supabase = supabaseClient();
    
    // Get the template parameters ready
    const firstName = recipient.firstName || recipient.name.split(' ')[0] || "User";
    const messageTitle = message.title || "your message";
    const timeUntilDeadline = details.timeUntilDeadline || "soon";
    const appUrl = details.appUrl || "https://app.yourdomain.com";
    
    if (debug) {
      console.log(`[WhatsApp] Using template parameters:`);
      console.log(`  - First name: ${firstName}`);
      console.log(`  - Message title: ${messageTitle}`);
      console.log(`  - Time until deadline: ${timeUntilDeadline}`);
      console.log(`  - App URL: ${appUrl}`);
    }
    
    // Call the send-whatsapp function with template parameters
    const { data: whatsAppResult, error: whatsAppError } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: formattedPhone,
        useTemplate: true,
        templateId: "HX48beb2c3b84ffbbed290f7f867ac0665", // Check-in reminder template SID
        templateParams: [firstName, messageTitle, timeUntilDeadline, appUrl],
        languageCode: "en_US"
      }
    });
    
    if (whatsAppError) {
      console.error(`[WhatsApp] Error sending template message:`, whatsAppError);
      return { 
        success: false, 
        error: whatsAppError.message || "Unknown error sending WhatsApp template message" 
      };
    }
    
    // Extract the message ID from the result (if available)
    const messageId = whatsAppResult?.messageId || whatsAppResult?.sid || "unknown";
    
    if (debug) console.log(`[WhatsApp] Template message sent successfully, ID: ${messageId}`);
    
    return { 
      success: true,
      messageId 
    };
    
  } catch (error: any) {
    console.error(`[WhatsApp] Exception sending template message:`, error);
    return { 
      success: false, 
      error: error.message || "Unknown error" 
    };
  }
}

/**
 * Format a phone number for WhatsApp usage
 * This is a backup in case the imported utility is not available
 */
function backupFormatWhatsAppNumber(phone: string): string {
  // Remove any existing whatsapp: prefix
  let cleaned = phone.replace("whatsapp:", "").trim();
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned.replace(/\D/g, '')}`;
  }
  
  // Return in proper WhatsApp format
  return `whatsapp:${cleaned}`;
}

/**
 * Utility to get app URL
 */
export async function getAppUrl(): Promise<string> {
  const supabase = supabaseClient();
  try {
    // Directly get from env if available
    const appDomain = Deno.env.get('APP_DOMAIN');
    if (appDomain) {
      return appDomain.startsWith('http') ? appDomain : `https://${appDomain}`;
    }
    
    // Fallback
    return "https://app.yourdomain.com";
  } catch (error) {
    console.warn("[WhatsApp] Error getting app domain:", error);
    return "https://app.yourdomain.com";
  }
}

/**
 * Format time until deadline in a human-readable way
 */
export function formatTimeUntilDeadline(deadlineDate: Date | string): string {
  const deadline = typeof deadlineDate === 'string' ? new Date(deadlineDate) : deadlineDate;
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = deadline.getTime() - now.getTime();
  
  // Convert to appropriate units
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Choose appropriate unit based on magnitude
  if (diffDays > 1) {
    return `${diffDays} days`;
  } else if (diffHours > 1) {
    return `${diffHours} hours`;
  } else if (diffMins > 1) {
    return `${diffMins} minutes`;
  } else {
    return "very soon"; // If we're really close to deadline
  }
}
