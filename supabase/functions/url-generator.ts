
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
    
    if (!supabaseUrl) {
      console.error("SUPABASE_URL environment variable is not set");
      throw new Error("Missing Supabase URL configuration");
    }
    
    // Make sure the URL doesn't have a trailing slash
    const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
    
    // Always ensure we have a fully qualified URL with protocol
    const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    
    // Construct the fully qualified access URL with query parameters
    const accessUrl = `${fullBaseUrl}/functions/v1/access-message?id=${messageId}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${deliveryId}`;
    
    console.log(`Generated absolute access URL with protocol: ${accessUrl}`);
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    throw error;
  }
}
