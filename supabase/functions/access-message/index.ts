
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { supabaseClient } from "./supabase-client.ts";

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);
  
  console.log(`[AccessMessage] Path: ${url.pathname}`);
  console.log(`[AccessMessage] Method: ${req.method}`);
  
  try {
    // Default handler - not found
    console.log("[AccessMessage] No matching route found");
    return new Response(
      JSON.stringify({ error: "Not found", path: path.join('/') }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in access-message function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error", 
        stack: error.stack,
        path: url.pathname
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
