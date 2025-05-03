
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckInRequest {
  userId: string;
  phoneNumber: string;
  method?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("WhatsApp check-in function called");
    
    // Parse the request body
    let requestData: CheckInRequest;
    
    try {
      requestData = await req.json();
      console.log("Received check-in request:", JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error("Invalid request body. Expected JSON object with 'userId' and 'phoneNumber'.");
    }
    
    const { userId, phoneNumber, method = "whatsapp" } = requestData;
    
    if (!userId) {
      throw new Error("Missing required parameter: userId");
    }
    
    // Initialize Supabase client
    const supabase = supabaseClient();
    const now = new Date().toISOString();
    
    console.log(`Processing check-in for user ${userId} via ${method} (phone: ${phoneNumber})`);
    
    try {
      // Get all active conditions for this user
      const { data: conditionsData, error: conditionsError } = await supabase
        .from("message_conditions")
        .select("id, message_id, messages!inner(user_id)")
        .eq("messages.user_id", userId)
        .eq("active", true);
        
      if (conditionsError) {
        throw new Error(conditionsError.message);
      }
      
      // Update all conditions with the new check-in time
      if (conditionsData && conditionsData.length > 0) {
        const conditionIds = conditionsData.map(c => c.id);
        console.log(`Updating ${conditionIds.length} active conditions with new check-in time`);
        
        const { error: updateError } = await supabase
          .from("message_conditions")
          .update({ 
            last_checked: now
          })
          .in("id", conditionIds);
          
        if (updateError) {
          throw new Error(updateError.message || "Failed to update conditions");
        }
        
        console.log("Successfully updated conditions with new check-in time");
      } else {
        console.log("No active conditions found for user");
      }
      
      // Log the check-in activity
      console.log(`Check-in successful for user ${userId} via ${method}`);
      
      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: now,
          method: method,
          conditions_updated: conditionsData?.length || 0
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (error: any) {
      console.error("Error performing check-in:", error);
      throw error;
    }
  } catch (error: any) {
    console.error("Error in WhatsApp check-in function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
