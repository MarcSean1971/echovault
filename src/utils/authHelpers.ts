
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';

/**
 * Get the current Supabase session, with token refresh if possible
 */
export async function getSession(): Promise<Session | null> {
  try {
    // Try to get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If session exists but might be close to expiration, refresh it
    if (session) {
      // Check if session is close to expiration (within 5 minutes)
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      
      if (expiresAt - now < fiveMinutes) {
        console.log("Session close to expiration, refreshing");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Error refreshing session:", refreshError);
          return session; // Return original session if refresh fails
        }
        
        return refreshData.session;
      }
    }
    
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Check if the current user is authenticated with a valid session
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
