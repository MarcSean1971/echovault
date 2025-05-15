
import { supabase } from "@/integrations/supabase/client";

// Function to get the authenticated client with token refresh
export const getAuthClient = async () => {
  try {
    // Check if session exists
    const { data: { session } } = await supabase.auth.getSession();
    
    // If session exists but might be close to expiry, refresh it
    if (session) {
      const expiresAt = session.expires_at; // Unix timestamp
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expiryThreshold = 300; // 5 minutes in seconds
      
      // If token will expire in the next 5 minutes, refresh it
      if (expiresAt && (expiresAt - now < expiryThreshold)) {
        console.log("[getAuthClient] Token nearing expiry, refreshing");
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("[getAuthClient] Error refreshing token:", error);
        } else {
          console.log("[getAuthClient] Token refreshed successfully");
        }
      }
    }
    
    // Return the client with fresh tokens
    return supabase;
  } catch (error) {
    console.error("[getAuthClient] Error preparing authenticated client:", error);
    // Return the regular client as fallback
    return supabase;
  }
};

// Function to check if user is authenticated
export const hasAuthToken = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("[hasAuthToken] Error checking auth token:", error);
    return false;
  }
};

// Function to set auth token (compatibility wrapper)
export const setSupabaseToken = (token: string | null) => {
  console.log("Supabase token management is now handled automatically by the Supabase client");
  // No need to manually set tokens with Supabase client
  return;
};

// Check network connectivity
export const checkSupabaseConnectivity = async (): Promise<boolean> => {
  try {
    // Simple health check by pinging a fast endpoint
    const startTime = performance.now();
    const { data, error } = await supabase.from('messages').select('count').limit(1);
    const endTime = performance.now();
    
    // Log latency for diagnostics
    console.log(`[checkSupabaseConnectivity] Response time: ${Math.round(endTime - startTime)}ms`);
    
    return !error;
  } catch (error) {
    console.error("[checkSupabaseConnectivity] Connection test failed:", error);
    return false;
  }
};
