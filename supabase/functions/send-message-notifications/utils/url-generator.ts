
/**
 * URL generation utilities for message access
 */

/**
 * Generate an access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string) {
  // Get the app domain from environment variable
  const appDomain = Deno.env.get("APP_DOMAIN") || "http://localhost:3000";
  
  // Ensure the domain has the protocol prefix
  const domainWithProtocol = appDomain.startsWith('http://') || appDomain.startsWith('https://') 
    ? appDomain 
    : `https://${appDomain}`;
  
  try {
    // Build the URL with the required parameters - using proper path structure
    // Change from query parameters to path parameters for messageId
    const url = new URL(`${domainWithProtocol}/access/message/${messageId}`);
    
    // Add necessary query parameters
    url.searchParams.append("delivery", deliveryId);
    url.searchParams.append("recipient", recipientEmail);
    
    console.log(`Generated access URL: ${url.toString()}`);
    return url.toString();
  } catch (error) {
    console.error(`Error generating access URL: ${error}`);
    // Fallback URL construction if URL constructor fails
    return `${domainWithProtocol}/access/message/${messageId}?delivery=${deliveryId}&recipient=${encodeURIComponent(recipientEmail)}`;
  }
}
