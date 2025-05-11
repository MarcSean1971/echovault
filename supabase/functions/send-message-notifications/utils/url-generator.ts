
/**
 * URL generation utilities for message access
 */

/**
 * Generate an access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string) {
  // Get the app domain from environment variable
  const appDomain = Deno.env.get("APP_DOMAIN") || "echo-vault.app";
  
  // Ensure the domain has the protocol prefix
  const domainWithProtocol = appDomain.startsWith('http://') || appDomain.startsWith('https://') 
    ? appDomain 
    : `https://${appDomain}`;
  
  try {
    // Base URL with properly formatted path
    const baseUrl = `${domainWithProtocol}/access/message/${encodeURIComponent(messageId)}`;
    
    // Add query parameters with proper encoding
    const url = new URL(baseUrl);
    url.searchParams.append("delivery", deliveryId);
    url.searchParams.append("recipient", recipientEmail);
    
    const accessUrl = url.toString();
    
    // Debug logging
    console.log(`Generated access URL: ${accessUrl}`);
    
    return accessUrl;
  } catch (error) {
    console.error(`Error generating access URL: ${error}`);
    
    // Fallback with direct string concatenation, being careful with encoding
    return `${domainWithProtocol}/access/message/${encodeURIComponent(messageId)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}`;
  }
}

/**
 * Generate a file access URL that uses the signed URL method (preferred)
 * This is now the default method since it's more reliable
 */
export function generateFileAccessUrl(filePath: string, recipientEmail: string, deliveryId: string) {
  // Get the app domain from environment variable
  const appDomain = Deno.env.get("APP_DOMAIN") || "echo-vault.app";
  
  // Ensure the domain has the protocol prefix
  const domainWithProtocol = appDomain.startsWith('http://') || appDomain.startsWith('https://') 
    ? appDomain 
    : `https://${appDomain}`;
    
  try {
    // FIXED: Always use the deliveryId in the path, not messageId
    // This ensures we're consistent with what the edge function expects
    const baseUrl = `${domainWithProtocol}/access/message/${encodeURIComponent(deliveryId)}`;
    
    // Add query parameters with proper encoding
    const url = new URL(baseUrl);
    url.searchParams.append("delivery", deliveryId);
    url.searchParams.append("recipient", recipientEmail);
    url.searchParams.append("attachment", encodeURIComponent(filePath));
    
    const fileAccessUrl = url.toString();
    
    console.log(`Generated file access URL: ${fileAccessUrl}`);
    
    return fileAccessUrl;
  } catch (error) {
    console.error(`Error generating file access URL: ${error}`);
    
    // Fallback with direct string concatenation
    return `${domainWithProtocol}/access/message/${encodeURIComponent(deliveryId)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}&attachment=${encodeURIComponent(filePath)}`;
  }
}

// This function is kept for backward compatibility
export function generateAttachmentUrl(messageId: string, recipientEmail: string, deliveryId: string, attachmentPath: string, attachmentName: string) {
  // Use the new file access function
  return generateFileAccessUrl(attachmentPath, recipientEmail, deliveryId);
}
