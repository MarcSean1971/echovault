
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
    // First properly encode parameters to avoid double encoding issues
    const encodedMessageId = encodeURIComponent(messageId);
    const encodedDeliveryId = encodeURIComponent(deliveryId);
    const encodedEmail = encodeURIComponent(recipientEmail);
    
    // Build the URL with the required parameters using proper path structure
    const url = new URL(`${domainWithProtocol}/access/message/${encodedMessageId}`);
    
    // Add necessary query parameters
    url.searchParams.append("delivery", encodedDeliveryId);
    url.searchParams.append("recipient", encodedEmail);
    
    const accessUrl = url.toString();
    console.log(`Generated access URL: ${accessUrl}`);
    
    // Verify URL components
    try {
      const parsedUrl = new URL(accessUrl);
      console.log(`URL verification - Path: ${parsedUrl.pathname}`);
      console.log(`URL verification - Parameters - Delivery: ${parsedUrl.searchParams.get('delivery')}`);
      console.log(`URL verification - Parameters - Recipient: ${parsedUrl.searchParams.get('recipient')}`);
    } catch (verifyError) {
      console.error(`URL verification error: ${verifyError}`);
    }
    
    return accessUrl;
  } catch (error) {
    console.error(`Error generating access URL: ${error}`);
    // Fallback URL construction with careful encoding
    const encodedMessageId = encodeURIComponent(messageId);
    const encodedDeliveryId = encodeURIComponent(deliveryId);
    const encodedEmail = encodeURIComponent(recipientEmail);
    
    return `${domainWithProtocol}/access/message/${encodedMessageId}?delivery=${encodedDeliveryId}&recipient=${encodedEmail}`;
  }
}

// This function is intentionally kept for backward compatibility
// but now simply returns the main message access URL
export function generateAttachmentUrl(messageId: string, recipientEmail: string, deliveryId: string, attachmentPath: string, attachmentName: string) {
  // Simply return the message access URL - attachments will be handled in the UI
  return generateAccessUrl(messageId, recipientEmail, deliveryId);
}
