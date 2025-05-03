
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
    // Get the application domain (if configured) or fallback to Supabase domain
    const appDomain = Deno.env.get("APP_DOMAIN") || "";
    
    if (!supabaseUrl) {
      console.error("SUPABASE_URL environment variable is not set");
      throw new Error("Missing Supabase URL configuration");
    }
    
    // Extract the domain to use for URL generation
    let domain;
    if (appDomain) {
      // Use explicit APP_DOMAIN if set
      domain = appDomain;
      console.log(`[URL Generator] Using APP_DOMAIN: ${domain}`);
    } else {
      // Extract the main domain from the Supabase URL
      // Converts e.g. https://project-id.supabase.co to project-id.supabase.co
      const urlObj = new URL(supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`);
      domain = urlObj.hostname;
      console.log(`[URL Generator] Using Supabase domain: ${domain}`);
    }
    
    // Ensure we use HTTPS protocol
    const protocol = "https";
    
    // IMPORTANT: We must use the frontend route for secure message
    // NOT the edge function path
    const accessUrl = `${protocol}://${domain}/secure-message?id=${messageId}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${deliveryId}`;
    
    console.log(`[URL Generator] Generated secure web access URL for message ${messageId}`);
    console.log(`[URL Generator] Full URL: ${accessUrl}`);
    console.log(`[URL Generator] Domain: ${domain}, Path: /secure-message`);
    console.log(`[URL Generator] Parameters: id=${messageId}, recipient=${encodeURIComponent(recipientEmail)}, delivery=${deliveryId}`);
    
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    console.error("Available environment variables:", Object.keys(Deno.env.toObject()).join(', '));
    throw error;
  }
}
