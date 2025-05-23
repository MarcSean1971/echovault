
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
    
    // Construct the access URL with the message ID and encoded email
    return `${baseUrl}/access/${messageId}?r=${encodedEmail}`;
  } catch (error) {
    console.error("Error generating access URL:", error);
    
    // Fallback to a simple URL without encoded email if there's an error
    const baseUrl = Deno.env.get("APP_URL") || "https://echo-vault.app";
    return `${baseUrl}/access/${messageId}`;
  }
}
