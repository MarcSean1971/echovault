
import { supabase, getSupabaseWithAuth } from "@/integrations/supabase/client";

// Global token storage (temporary solution)
let currentToken: string | null = null;

// Function to set the token from components
export const setSupabaseToken = (token: string | null) => {
  currentToken = token;
};

// Function to get an authenticated client using the stored token
export const getAuthClient = async () => {
  return getSupabaseWithAuth(currentToken || undefined);
};
