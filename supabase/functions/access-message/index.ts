
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { routeRequest } from "./router.ts";
import { checkSupabaseConnection } from "./supabase-client.ts";

console.log("Starting access-message server...");

// Log environment configuration (without sensitive values)
const environment = Deno.env.get("SUPABASE_ENV") || "unknown";
const supabaseUrl = Deno.env.get("SUPABASE_URL") 
  ? `${new URL(Deno.env.get("SUPABASE_URL") || "").hostname} (set)` 
  : "not set";
const appDomain = Deno.env.get("APP_DOMAIN") || "not set";

console.log("Server configuration:", {
  environment,
  url: supabaseUrl,
  appDomain,
  availableEnvVars: Object.keys(Deno.env.toObject()).join(', ')
});

// Test database connection during startup
checkSupabaseConnection()
  .then(result => {
    if (result.success) {
      console.log("Database connection verified during startup");
    } else {
      console.error("Failed to connect to database during startup:", result.error);
    }
  })
  .catch(err => {
    console.error("Error testing database connection:", err);
  });

// Log an additional startup message to ensure a change is detected
console.log("Ready to handle requests... (JWT verification disabled, Updated: 2025-05-04)");

// The serve function handles incoming requests and routes them
serve(async (req: Request) => {
  try {
    // Log the request headers for debugging
    console.log("Received request headers:", Object.fromEntries(req.headers.entries()));
    
    // Extract origin for CORS
    const origin = req.headers.get("origin") || "*";
    console.log("Request origin:", origin);
    
    // Check for Supabase auth headers, try to find them in various places
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey") || req.headers.get("x-client-info");
    
    console.log("Auth header present:", !!authHeader);
    console.log("API key present:", !!apiKey);
    
    // JWT verification is disabled in config.toml, so we don't need to worry about auth headers
    // All requests will be processed without JWT verification
    
    return await routeRequest(req);
  } catch (error: any) {
    console.error("Unhandled error in request processing:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: error.message || "An unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        }
      }
    );
  }
});
