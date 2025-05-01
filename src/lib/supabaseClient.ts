
import { supabase } from "@/integrations/supabase/client";

// Function to get the authenticated client
export const getAuthClient = () => {
  return supabase;
};

// Function to check if user is authenticated
export const hasAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};
