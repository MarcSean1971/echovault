
import { supabase, getSupabaseWithAuth } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Global token storage (temporary solution)
let currentToken: string | null = null;

// Function to set the token from components
export const setSupabaseToken = (token: string | null) => {
  currentToken = token;
  console.log("Token updated:", token ? "Token set" : "Token cleared");
};

// Function to get an authenticated client using the stored token
export const getAuthClient = async () => {
  if (!currentToken) {
    console.warn("No authentication token available, using anonymous client");
    return supabase; // Return the default client without auth
  }
  
  try {
    return getSupabaseWithAuth(currentToken);
  } catch (error) {
    console.error("Error creating authenticated Supabase client:", error);
    return supabase; // Fallback to anonymous client
  }
};

// Function to check if we have an auth token
export const hasAuthToken = () => {
  return !!currentToken;
};
