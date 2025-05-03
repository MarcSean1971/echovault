
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
    
    // Extract the main domain from the Supabase URL
    // Converts e.g. https://project-id.supabase.co to project-id.supabase.co
    const urlObj = new URL(supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`);
    const domain = urlObj.hostname;
    
    // Construct a fully qualified URL to the web application's secure message page
    // Using the correct path for the secure message page in the app, not the edge function
    const accessUrl = `https://${domain}/secure-message?id=${messageId}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${deliveryId}`;
    
    console.log(`Generated secure web access URL for message ${messageId}, recipient ${recipientEmail}: ${accessUrl}`);
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    throw error;
  }
}
