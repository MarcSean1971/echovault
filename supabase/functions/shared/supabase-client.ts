
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

/**
 * Create a Supabase client with admin privileges
 */
export function createSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[SupabaseAdmin] Missing required environment variables");
    throw new Error("Missing environment variables for Supabase client");
  }
  
  console.log("[SupabaseAdmin] Creating Supabase admin client");
  
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey
        }
      }
    });
  } catch (error) {
    console.error("[SupabaseAdmin] Error creating Supabase admin client:", error);
    throw new Error(`Failed to initialize Supabase admin client: ${error.message}`);
  }
}

/**
 * Create a Supabase client with anonymous privileges
 */
export function createSupabaseAnon() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("[SupabaseAnon] Missing required environment variables");
    throw new Error("Missing environment variables for anonymous Supabase client");
  }
  
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    console.error("[SupabaseAnon] Error creating anonymous Supabase client:", error);
    throw new Error(`Failed to initialize anonymous Supabase client: ${error.message}`);
  }
}
