
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/utils/authHelpers";

/**
 * Helper function to get authenticated client
 */
export async function getAuthClient() {
  // Get the current session to ensure we're authenticated
  const session = await getSession();
  
  if (!session) {
    console.warn("No active session found when getting auth client");
  }
  
  return supabase;
}

/**
 * Check if we can connect to Supabase
 * Useful for detecting network connectivity issues
 */
export async function checkSupabaseConnectivity(): Promise<boolean> {
  try {
    // Use a lightweight RPC call or a simple query to check connectivity
    // instead of querying a non-existent table
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    // We're just checking if we can reach Supabase, not interested in the actual data
    return !error || !error.message.includes('network');
  } catch (error) {
    console.error("Error checking Supabase connectivity:", error);
    return false;
  }
}
