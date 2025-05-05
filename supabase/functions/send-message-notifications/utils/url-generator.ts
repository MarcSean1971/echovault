
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

/**
 * Generate a file access URL that uses our secure edge function
 */
export function generateFileAccessUrl(filePath: string, recipientEmail: string, deliveryId: string) {
  // Get the app domain from environment variable
  const appDomain = Deno.env.get("APP_DOMAIN") || "http://localhost:3000";
  
  // Ensure the domain has the protocol prefix
  const domainWithProtocol = appDomain.startsWith('http://') || appDomain.startsWith('https://') 
    ? appDomain 
    : `https://${appDomain}`;
  
  try {
    // First properly encode parameters to avoid double encoding issues  
    const encodedFilePath = encodeURIComponent(filePath);
    const encodedDeliveryId = encodeURIComponent(deliveryId);
    const encodedEmail = encodeURIComponent(recipientEmail);
    
    // Build the file access URL using our edge function
    const url = new URL(`${domainWithProtocol}/functions/v1/access-file/file/${encodedFilePath}`);
    
    // Add necessary query parameters
    url.searchParams.append("delivery", encodedDeliveryId);
    url.searchParams.append("recipient", encodedEmail);
    
    const fileAccessUrl = url.toString();
    console.log(`Generated file access URL: ${fileAccessUrl}`);
    
    return fileAccessUrl;
  } catch (error) {
    console.error(`Error generating file access URL: ${error}`);
    
    // Fallback URL construction with careful encoding
    const encodedFilePath = encodeURIComponent(filePath);
    const encodedDeliveryId = encodeURIComponent(deliveryId);
    const encodedEmail = encodeURIComponent(recipientEmail);
    
    return `${domainWithProtocol}/functions/v1/access-file/file/${encodedFilePath}?delivery=${encodedDeliveryId}&recipient=${encodedEmail}`;
  }
}

// This function is intentionally kept for backward compatibility
// but now uses our new file access endpoint
export function generateAttachmentUrl(messageId: string, recipientEmail: string, deliveryId: string, attachmentPath: string, attachmentName: string) {
  // Use the new file access function
  return generateFileAccessUrl(attachmentPath, recipientEmail, deliveryId);
}
