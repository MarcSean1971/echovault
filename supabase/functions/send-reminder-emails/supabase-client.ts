
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

/**
 * Create a Supabase client instance for use in the edge function
 */
export function supabaseClient() {
  // Create a Supabase client with the service role key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
