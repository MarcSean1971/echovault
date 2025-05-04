
/**
 * URL generation utilities for message access
 */

/**
 * Generate an access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string) {
  // Get the app domain from environment variable
  const appDomain = Deno.env.get("APP_DOMAIN") || "http://localhost:3000";
  
  // Build the URL with the required parameters
  const url = new URL(`${appDomain}/message/${messageId}`);
  url.searchParams.append("delivery", deliveryId);
  url.searchParams.append("recipient", recipientEmail);
  
  return url.toString();
}
