
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * Create a Supabase client with admin privileges with enhanced retry logic
 * Always using service role key to ensure authorization works regardless of auth header
 */
export function createSupabaseClient(authHeader?: string | null) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[AccessFile] Missing required environment variables");
    throw new Error("Missing environment variables for Supabase client");
  }
  
  console.log(`[AccessFile] Creating Supabase client with service role key, auth header: ${authHeader ? 'Present' : 'Missing'}`);
  
  try {
    // Create client with enhanced connection options for better reliability
    // ALWAYS using the service role key for authorization, ignoring the auth header
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        // Always include the Authorization header with the service role key
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey
        },
        // Add more reliable fetch options with increased timeout
        fetch: (url, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
              "Pragma": "no-cache",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Authorization": `Bearer ${supabaseKey}`, // Ensure auth header is always set
              "apikey": supabaseKey
            }
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
