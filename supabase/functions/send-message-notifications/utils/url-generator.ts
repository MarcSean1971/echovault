
/**
 * URL generation utilities for message notifications
 */

/**
 * Generate a secure access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string): string {
  try {
    // Get the Supabase URL and project ID from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    // Extract the project ID from the Supabase URL
    // Required for fully qualified function URLs
    const projectIdMatch = supabaseUrl.match(/\/projects\/([^\/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : "onwthrpgcnfydxzzmyot"; // Fall back to the known project ID
    
    // Construct the fully qualified access URL with query parameters
    const accessUrl = `${supabaseUrl}/functions/v1/access-message?id=${messageId}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${deliveryId}`;
    
    console.log(`Generated access URL: ${accessUrl}`);
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    throw error;
  }
}
