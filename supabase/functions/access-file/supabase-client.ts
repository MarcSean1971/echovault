
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * Create a Supabase client with admin privileges with enhanced retry logic
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
    // Create client with enhanced connection options for better reliability
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        // Add more reliable fetch options with increased timeout
        fetch: (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
              "Pragma": "no-cache",
              "Cache-Control": "no-cache"
            },
          }).finally(() => clearTimeout(timeoutId));
        }
      },
      db: {
        // More strict schema validation for better error messages
        schema: 'public'
      },
      // Disable retryOnConflict to force immediate failure on conflict errors
      postgrest: {
        retryOnConflict: false
      }
    });
  } catch (error) {
    console.error("[AccessFile] Error creating Supabase client:", error);
    throw new Error(`Failed to initialize Supabase client: ${error.message}`);
  }
}
