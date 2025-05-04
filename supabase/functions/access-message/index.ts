
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
console.log("Ready to handle requests... (Updated: 2025-05-04)");
serve(routeRequest);
