
import { corsHeaders } from "./cors-headers.ts";
import { handleVerifyPin } from "./handlers/verify-pin-handler.ts";
import { handleRecordView } from "./handlers/record-view-handler.ts";
import { handleMessageAccess } from "./handlers/message-access-handler.ts";
import { handleDownloadAttachment } from "./handlers/download-attachment-handler.ts";
import { renderErrorPage } from "./templates/error-page.ts";
import { checkSupabaseConnection } from "./supabase-client.ts";

/**
 * Routes the incoming request to the appropriate handler with enhanced error logging
 */
export async function routeRequest(req: Request): Promise<Response> {
  try {
    console.log(`[Router] Routing request: ${req.url}`);
    console.log(`[Router] Request method: ${req.method}`);
    
    // Set HTML content type for all HTML responses with proper headers
    const htmlHeaders = { 
      "Content-Type": "text/html; charset=utf-8", 
      ...corsHeaders 
    };
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    console.log(`[Router] Parsed URL: ${url.toString()}`);
    console.log(`[Router] Path: ${url.pathname}`);
    console.log(`[Router] Search params: ${url.search}`);
    
    // Log ALL headers for debugging auth issues
    const headersDebug = Array.from(req.headers.entries())
      .map(([key, value]) => `${key}: ${key.toLowerCase().includes('auth') ? '[REDACTED]' : value}`)
      .join('\n');
    console.log(`[Router] Request headers:\n${headersDebug}`);
    
    // Detect if request is coming from custom domain vs direct Supabase URL
    const host = req.headers.get('host') || '';
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';
    
    console.log(`[Router] Request host: ${host}`);
    console.log(`[Router] Request origin: ${origin}`);
    console.log(`[Router] Request referer: ${referer}`);
    
    // Extract client info
    const clientInfo = req.headers.get('x-client-info') || 'Unknown client';
    console.log(`[Router] Client info: ${clientInfo}`);
    
    // Log search params for debugging
    console.log("[Router] URL search params:", Object.fromEntries(url.searchParams.entries()));
    
    // Test database connection
    const connectionResult = await checkSupabaseConnection();
    if (!connectionResult.success) {
      console.error("[Router] Database connection test failed:", connectionResult.error);
      const errorHtml = renderErrorPage(
        "Database Connection Error", 
        "We're having trouble connecting to our database. Please try again in a few moments."
      );
      return new Response(errorHtml, { 
        status: 500, 
        headers: htmlHeaders
      });
    }
    
    // Use APP_DOMAIN from environment if available
    const appDomain = Deno.env.get("APP_DOMAIN");
    console.log(`[Router] APP_DOMAIN environment variable: ${appDomain || 'not set'}`);

    const pathParts = url.pathname.split('/');
    console.log("[Router] Path parts:", pathParts);
    
    // Check for PIN verification endpoint
    if (pathParts.includes("verify-pin")) {
      console.log("[Router] Routing to verify-pin handler");
      return await handleVerifyPin(req);
    }
    
    // Check for record view endpoint
    if (pathParts.includes("record-view")) {
      console.log("[Router] Routing to record-view handler");
      return await handleRecordView(req);
    }
    
    // Check for attachment download endpoint
    if (pathParts.includes("download-attachment")) {
      console.log("[Router] Routing to download-attachment handler");
      return await handleDownloadAttachment(req);
    }
    
    // Default to message access handler - now accepting both path and query parameters
    console.log("[Router] Routing to message access handler");
    try {
      return await handleMessageAccess(req, url);
    } catch (messageAccessError: any) {
      console.error("[Router] Error in handleMessageAccess:", messageAccessError);
      console.error("[Router] Error stack:", messageAccessError.stack);
      const errorHtml = renderErrorPage("Error accessing message", messageAccessError.message);
      return new Response(errorHtml, { 
        status: 500, 
        headers: htmlHeaders
      });
    }
    
  } catch (error: any) {
    console.error("[Router] Error routing request:", error);
    console.error("[Router] Error stack:", error.stack);
    
    // Include available environment information in logs
    const envVarNames = Object.keys(Deno.env.toObject()).join(', ');
    console.error(`[Router] Available environment variables: ${envVarNames}`);
    
    const errorHtml = renderErrorPage(
      "Error processing request", 
      "We encountered a problem processing your request. Our team has been notified."
    );
    
    return new Response(errorHtml, { 
      status: 500, 
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }
    });
  }
}
