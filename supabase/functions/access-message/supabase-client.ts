
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * Enhanced Supabase client factory with multiple connection methods and detailed logging
 */
export function supabaseClient() {
  try {
    // Standard connection method with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Will try alternative connection method.");
    } else {
      console.log(`Connecting to Supabase with URL: ${new URL(supabaseUrl).hostname}`);
      console.log(`Service role key is ${supabaseKey ? "set" : "not set"}`);
      
      return createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }
  } catch (initError) {
    console.error("Error initializing standard Supabase client:", initError);
    console.error("Will try alternative connection method.");
  }
  
  // If we reach here, either standard credentials are missing or initialization failed
  // Log the environment variables available (without values for security)
  const envVars = Object.keys(Deno.env.toObject()).join(', ');
  console.log(`Available environment variables: ${envVars}`);
  
  throw new Error("Failed to initialize Supabase client. Environment configuration is incomplete.");
}

/**
 * Check if Supabase client can connect to the database
 */
export async function checkSupabaseConnection() {
  try {
    const client = supabaseClient();
    console.log("Testing database connection...");
    
    const { data, error } = await client.from("messages").select("count").limit(1);
    
    if (error) {
      console.error("Connection test failed:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Supabase connection test successful");
    return { success: true };
  } catch (error) {
    console.error("Connection test exception:", error);
    return { success: false, error: error.message };
  }
}
