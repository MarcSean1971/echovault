import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export function createSupabaseClient(forceServiceRole = false) {
  // Environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  // Always use service role key for admin privileges when specified
  // This ensures we have full access to all rows regardless of RLS policies
  if (forceServiceRole) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`
        }
      }
    });
  }
  
  // Otherwise use the anon key for public access
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
