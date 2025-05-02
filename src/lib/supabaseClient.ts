
import { supabase } from "@/integrations/supabase/client";

// Function to get the authenticated client
export const getAuthClient = async () => {
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If there is a session, create an authenticated client
  if (session) {
    return supabase;
  }
  
  // Return the regular client if no session exists
  return supabase;
};

// Function to check if user is authenticated
export const hasAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Function to set auth token (compatibility wrapper)
export const setSupabaseToken = (token: string | null) => {
  console.log("Supabase token management is now handled automatically by the Supabase client");
  // No need to manually set tokens with Supabase client
  return;
};
