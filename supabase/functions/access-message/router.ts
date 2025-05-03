
import { corsHeaders } from "./cors-headers.ts";
import { handleVerifyPin } from "./handlers/verify-pin-handler.ts";
import { handleRecordView } from "./handlers/record-view-handler.ts";
import { handleMessageAccess } from "./handlers/message-access-handler.ts";
import { renderErrorPage } from "./templates/error-page.ts";

/**
 * Routes the incoming request to the appropriate handler
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
    console.log(`[Router] Request headers:`, Object.fromEntries(req.headers.entries()));
    
    // Log search params for debugging
    console.log("[Router] URL search params:", Object.fromEntries(url.searchParams.entries()));
    
    const pathParts = url.pathname.split('/');
    console.log("[Router] Path parts:", pathParts);
    
    // Check for PIN verification endpoint
    if (pathParts[pathParts.length - 1] === "verify-pin") {
      console.log("[Router] Routing to verify-pin handler");
      return await handleVerifyPin(req);
    }
    
    // Check for record view endpoint
    if (pathParts[pathParts.length - 1] === "record-view") {
      console.log("[Router] Routing to record-view handler");
      return await handleRecordView(req);
    }
    
    // Default to message access handler
    console.log("[Router] Routing to message access handler");
    try {
      return await handleMessageAccess(req, url);
    } catch (messageAccessError: any) {
      console.error("[Router] Error in handleMessageAccess:", messageAccessError);
      const errorHtml = renderErrorPage("Error accessing message", messageAccessError.message);
      return new Response(errorHtml, { 
        status: 500, 
        headers: htmlHeaders
      });
    }
    
  } catch (error: any) {
    console.error("[Router] Error routing request:", error);
    console.error("[Router] Error stack:", error.stack);
    const errorHtml = renderErrorPage("Error processing request", error.message);
    return new Response(errorHtml, { 
      status: 500, 
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }
    });
  }
}
