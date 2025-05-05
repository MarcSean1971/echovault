
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
    // Build the URL with the required parameters using proper path structure
    const url = new URL(`${domainWithProtocol}/access/message/${encodeURIComponent(messageId)}`);
    
    // Add necessary query parameters with proper encoding
    url.searchParams.append("delivery", encodeURIComponent(deliveryId));
    url.searchParams.append("recipient", encodeURIComponent(recipientEmail));
    
    const accessUrl = url.toString();
    console.log(`Generated access URL: ${accessUrl}`);
    
    // Verify URL components
    try {
      const parsedUrl = new URL(accessUrl);
      console.log(`URL verification - Path: ${parsedUrl.pathname}, Delivery: ${parsedUrl.searchParams.get('delivery')}, Recipient: ${parsedUrl.searchParams.get('recipient')}`);
    } catch (verifyError) {
      console.error(`URL verification error: ${verifyError}`);
    }
    
    return accessUrl;
  } catch (error) {
    console.error(`Error generating access URL: ${error}`);
    // Fallback URL construction with encoding
    return `${domainWithProtocol}/access/message/${encodeURIComponent(messageId)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}`;
  }
}
