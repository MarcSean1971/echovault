
/**
 * Get Twilio credentials from environment variables
 */
export function getTwilioCredentials(): { accountSid: string; authToken: string; messagingServiceSid: string } {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not set");
  }
  
  if (!messagingServiceSid) {
    console.warn("TWILIO_MESSAGING_SERVICE_SID is not set, using direct messaging");
  }
  
  return {
    accountSid,
    authToken,
    messagingServiceSid: messagingServiceSid || ''
  };
}
