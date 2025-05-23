
/**
 * Format a deadline time string into a human-readable format
 */
export function formatDeadlineTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error("Error formatting deadline time:", error);
    return dateString; // Return the original string if formatting fails
  }
}

/**
 * Get Twilio credentials from environment variables
 */
export function getTwilioCredentials() {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials missing. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.");
  }
  
  return { accountSid, authToken };
}

/**
 * CORS headers for cross-origin requests
 * Fixed: Added missing CORS headers export
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
