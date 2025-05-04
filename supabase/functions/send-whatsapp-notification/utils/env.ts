
// Environment variable management

/**
 * Gets required environment variables
 * @returns Object containing Twilio credentials
 * @throws Error if any required environment variable is missing
 */
export function getTwilioCredentials() {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioWhatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

  if (!accountSid || !authToken || !twilioWhatsappNumber) {
    throw new Error("Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER.");
  }

  return { accountSid, authToken, twilioWhatsappNumber };
}
