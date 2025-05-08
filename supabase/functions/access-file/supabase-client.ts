
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * Create a Supabase client with admin privileges
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
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    console.error("[AccessFile] Error creating Supabase client:", error);
    throw new Error(`Failed to initialize Supabase client: ${error.message}`);
  }
}
