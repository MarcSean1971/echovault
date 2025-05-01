
import { supabase, getSupabaseWithAuth } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Global token storage (temporary solution)
let currentToken: string | null = null;

// Function to set the token from components
export const setSupabaseToken = (token: string | null) => {
  currentToken = token;
};

// Function to get an authenticated client using the stored token
export const getAuthClient = async () => {
  if (!currentToken) {
    console.warn("No authentication token available, using anonymous client");
  }
  return getSupabaseWithAuth(currentToken || "");
};
