
/**
 * URL generation utilities for message notifications
 */

/**
 * Generate a secure access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string): string {
  try {
    // Get the Supabase URL from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    // Construct the access URL with query parameters - consistently using query parameters
    // This matches our updated access-message function that now supports query parameters
    const accessUrl = `${supabaseUrl}/functions/v1/access-message?id=${messageId}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${deliveryId}`;
    
    console.log(`Generated access URL: ${accessUrl}`);
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    throw error;
  }
}
