
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Create a Supabase client for the edge function to use
 */
export function supabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  
  // Use the service role key for admin privileges
  return createClient(supabaseUrl, supabaseServiceKey);
}
