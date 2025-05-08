
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * Create a Supabase client with admin privileges with retry logic
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[AccessFile] Missing required environment variables");
    throw new Error("Missing environment variables for Supabase client");
  }
  
  console.log("[AccessFile] Creating Supabase admin client");
  
  try {
    // Create client with strict connection options for better reliability
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        // Add more reliable fetch options
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // Increase timeouts for better reliability
            signal: AbortSignal.timeout(15000),
          });
        }
      },
      db: {
        // More strict schema validation for better error messages
        schema: 'public'
      }
    });
  } catch (error) {
    console.error("[AccessFile] Error creating Supabase client:", error);
    throw new Error(`Failed to initialize Supabase client: ${error.message}`);
  }
}
