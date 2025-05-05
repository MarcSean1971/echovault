
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { supabaseClient } from "./supabase-client.ts";
import { handleDownloadAttachment } from "./handlers/download-attachment-handler.ts";

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);
  
  console.log(`[AccessMessage] Path: ${url.pathname}`);
  
  try {
    // Route for downloading attachments
    if (path[1] === "download" && path.length >= 3) {
      return await handleDownloadAttachment(req);
    }

    // Default handler - not found
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in access-message function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
