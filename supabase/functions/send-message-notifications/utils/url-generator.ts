
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
  // Use the Supabase URL for edge functions
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://onwthrpgcnfydxzzmyot.supabase.co";
  
  // Note: We no longer generate edge function URLs directly
  // Instead we will rely on the client-side to generate signed URLs
  // which don't require the edge function
  
  try {
    const appDomain = Deno.env.get("APP_DOMAIN") || "echo-vault.app";
    const domainWithProtocol = appDomain.startsWith('http://') || appDomain.startsWith('https://') 
      ? appDomain 
      : `https://${appDomain}`;

    // Create a URL that points to the message with the attachment
    // The client-side will handle accessing the attachment via signed URL
    const baseUrl = `${domainWithProtocol}/access/message/${encodeURIComponent(deliveryId)}`;
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
    const appDomain = Deno.env.get("APP_DOMAIN") || "echo-vault.app";
    const domainWithProtocol = appDomain.startsWith('http://') || appDomain.startsWith('https://') 
      ? appDomain 
      : `https://${appDomain}`;
    
    return `${domainWithProtocol}/access/message/${encodeURIComponent(deliveryId)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}&attachment=${encodeURIComponent(filePath)}`;
  }
}

// This function is kept for backward compatibility
export function generateAttachmentUrl(messageId: string, recipientEmail: string, deliveryId: string, attachmentPath: string, attachmentName: string) {
  // Use the new file access function
  return generateFileAccessUrl(attachmentPath, recipientEmail, deliveryId);
}
