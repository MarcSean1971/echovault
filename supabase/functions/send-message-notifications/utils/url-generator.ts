
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
    console.log(`URL verification - Original messageId: ${messageId}`);
    console.log(`URL verification - Original deliveryId: ${deliveryId}`);
    console.log(`URL verification - Original recipientEmail: ${recipientEmail}`);
    
    return accessUrl;
  } catch (error) {
    console.error(`Error generating access URL: ${error}`);
    
    // Fallback with direct string concatenation, being careful with encoding
    return `${domainWithProtocol}/access/message/${encodeURIComponent(messageId)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}`;
  }
}

/**
 * Generate a file access URL that uses our secure edge function
 */
export function generateFileAccessUrl(filePath: string, recipientEmail: string, deliveryId: string) {
  // Use the Supabase URL for edge functions
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://onwthrpgcnfydxzzmyot.supabase.co";
  
  try {
    // Make sure the filePath is properly encoded
    const encodedFilePath = encodeURIComponent(filePath);
    
    // Build the base URL
    const baseUrl = `${supabaseUrl}/functions/v1/access-file/file/${encodedFilePath}`;
    
    // Build complete URL with query parameters
    const url = new URL(baseUrl);
    url.searchParams.append("delivery", deliveryId);
    url.searchParams.append("recipient", recipientEmail);
    
    const fileAccessUrl = url.toString();
    
    // Debug logging
    console.log(`Generated file access URL: ${fileAccessUrl}`);
    console.log(`URL verification - Original filePath: ${filePath}`);
    console.log(`URL verification - Original deliveryId: ${deliveryId}`);
    console.log(`URL verification - Original recipientEmail: ${recipientEmail}`);
    
    return fileAccessUrl;
  } catch (error) {
    console.error(`Error generating file access URL: ${error}`);
    
    // Fallback with direct string concatenation
    return `${supabaseUrl}/functions/v1/access-file/file/${encodeURIComponent(filePath)}?delivery=${encodeURIComponent(deliveryId)}&recipient=${encodeURIComponent(recipientEmail)}`;
  }
}

// This function is intentionally kept for backward compatibility
// but now uses our new file access endpoint
export function generateAttachmentUrl(messageId: string, recipientEmail: string, deliveryId: string, attachmentPath: string, attachmentName: string) {
  // Use the new file access function
  return generateFileAccessUrl(attachmentPath, recipientEmail, deliveryId);
}
