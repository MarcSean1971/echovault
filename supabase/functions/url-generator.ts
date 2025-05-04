
/**
 * URL generation utilities for message notifications
 */

/**
 * Generate a secure access URL for a message
 */
export function generateAccessUrl(messageId: string, recipientEmail: string, deliveryId: string): string {
  try {
    // Get the application domain (if configured) or fallback to Supabase domain
    const appDomain = Deno.env.get("APP_DOMAIN") || "";
    // Get the Supabase URL from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    if (!supabaseUrl && !appDomain) {
      console.error("Neither APP_DOMAIN nor SUPABASE_URL environment variable is set");
      throw new Error("Missing domain configuration");
    }
    
    // Extract the domain to use for URL generation
    let domain;
    let protocol = "https";
    
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
    
    // Generate the URL with required parameters including deliveryId
    // Ensure all query parameters are properly encoded
    const accessUrl = `${protocol}://${domain}/secure-message?id=${encodeURIComponent(messageId)}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${encodeURIComponent(deliveryId)}`;
    
    console.log(`[URL Generator] Generated URL for message ${messageId}: ${accessUrl}`);
    
    return accessUrl;
  } catch (error) {
    console.error("Error generating access URL:", error);
    console.error("Available environment variables:", Object.keys(Deno.env.toObject()).join(', '));
    
    // Provide a fallback URL using the project ID as a last resort
    const projectId = "onwthrpgcnfydxzzmyot";
    const fallbackUrl = `https://${projectId}.supabase.co/secure-message?id=${encodeURIComponent(messageId)}&recipient=${encodeURIComponent(recipientEmail)}&delivery=${encodeURIComponent(deliveryId)}`;
    console.log(`[URL Generator] Using fallback URL: ${fallbackUrl}`);
    
    return fallbackUrl;
  }
}
