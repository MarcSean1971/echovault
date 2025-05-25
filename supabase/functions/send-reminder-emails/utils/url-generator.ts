
/**
 * URL generator utility for message access links
 * 
 * This module generates secure access URLs for messages
 */

/**
 * Generate a secure access URL for a message
 * @param messageId The ID of the message
 * @param email The email address of the recipient
 * @returns The secure access URL
 */
export function generateAccessUrl(messageId: string, email: string): string {
  try {
    // Base URL from environment or fallback to default
    const baseUrl = Deno.env.get("APP_URL") || "https://echo-vault.app";
    
    // Create URL-safe Base64 encoded email (for tracking and verification)
    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    // Construct the access URL with the correct route format
    return `${baseUrl}/access/message/${messageId}?r=${encodedEmail}`;
  } catch (error) {
    console.error("Error generating access URL:", error);
    
    // Fallback to a simple URL without encoded email if there's an error
    const baseUrl = Deno.env.get("APP_URL") || "https://echo-vault.app";
    return `${baseUrl}/access/message/${messageId}`;
  }
}

/**
 * Generate a check-in URL for reminder emails
 * @param messageId The ID of the message (optional for general check-in)
 * @returns The check-in URL
 */
export function generateCheckInUrl(messageId?: string): string {
  try {
    const baseUrl = Deno.env.get("APP_URL") || "https://echo-vault.app";
    
    if (messageId) {
      // If we have a specific message, link to the messages page where they can check in
      return `${baseUrl}/messages`;
    }
    
    // General check-in page
    return `${baseUrl}/check-in`;
  } catch (error) {
    console.error("Error generating check-in URL:", error);
    const baseUrl = Deno.env.get("APP_URL") || "https://echo-vault.app";
    return `${baseUrl}/check-in`;
  }
}
