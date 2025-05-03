
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { routeRequest } from "./router.ts";

console.log("Starting access-message server...");
console.log("Server configuration:", {
  environment: Deno.env.get("SUPABASE_ENV") || "unknown",
  url: Deno.env.get("SUPABASE_URL") || "not set",
});

console.log("Ready to handle requests...");
serve(routeRequest);
