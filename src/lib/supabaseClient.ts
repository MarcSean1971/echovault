
import { supabase } from "@/integrations/supabase/client";

// Cache for the authenticated client status
let cachedAuthStatus = null;
let authCheckPromise = null;

// Function to get the authenticated client
export const getAuthClient = async () => {
  // Return cached result if available
  if (cachedAuthStatus !== null) {
    return supabase;
  }
  
  // If a check is already in progress, return that promise
  if (authCheckPromise) {
    await authCheckPromise;
    return supabase;
  }
  
  // Start a new auth check
  authCheckPromise = (async () => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Cache the auth status
      cachedAuthStatus = !!session;
      
      // Listen for auth changes to invalidate cache
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        cachedAuthStatus = null;
      });
      
      return cachedAuthStatus;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    } finally {
      authCheckPromise = null;
    }
  })();
  
  await authCheckPromise;
  return supabase;
};

// Function to check if user is authenticated
export const hasAuthToken = async () => {
  if (cachedAuthStatus !== null) {
    return cachedAuthStatus;
  }
  
  const { data } = await supabase.auth.getSession();
  cachedAuthStatus = !!data.session;
  return cachedAuthStatus;
};

// Function to set auth token (compatibility wrapper)
export const setSupabaseToken = (token: string | null) => {
  console.log("Supabase token management is now handled automatically by the Supabase client");
  // No need to manually set tokens with Supabase client
  cachedAuthStatus = null;
  return;
};
