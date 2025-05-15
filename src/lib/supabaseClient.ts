
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
    // Perform a lightweight query to verify connectivity
    const { error } = await supabase.from('_realtime').select('subscription_id').limit(1).maybeSingle();
    
    // We don't care about data, just if there's a network error
    return !error || !error.message.includes('network');
  } catch (error) {
    console.error("Error checking Supabase connectivity:", error);
    return false;
  }
}
