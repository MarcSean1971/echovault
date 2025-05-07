
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createSuccessResponse, createErrorResponse } from "../shared/whatsapp-utils.ts";
import { createSupabaseAdmin } from "../shared/supabase-client.ts";

/**
 * Processes a check-in from WhatsApp and updates condition timestamps
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CHECK-IN] Processing WhatsApp check-in request");
    
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return createErrorResponse({ message: "Invalid JSON in request body" }, 400);
    }
    
    const { userId, phoneNumber, method = "whatsapp" } = requestData;
    
    if (!userId) {
      return createErrorResponse({ message: "Missing required parameter: userId" }, 400);
    }
    
    console.log(`[CHECK-IN] Processing check-in for user ${userId} via ${method}`);
    
    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    
    // Get all active conditions for this user
    const { data: conditionsData, error: conditionsError } = await supabase
      .from("message_conditions")
      .select("id, message_id, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true);
      
    if (conditionsError) {
      throw new Error(`Error fetching conditions: ${conditionsError.message}`);
    }
    
    console.log(`[CHECK-IN] Found ${conditionsData?.length || 0} active conditions for user ${userId}`);
    
    // Update all conditions with the new check-in time
    if (conditionsData && conditionsData.length > 0) {
      const conditionIds = conditionsData.map(c => c.id);
      
      const { error: updateError } = await supabase
        .from("message_conditions")
        .update({ last_checked: now })
        .in("id", conditionIds);
        
      if (updateError) {
        throw new Error(`Failed to update conditions: ${updateError.message}`);
      }
      
      console.log("[CHECK-IN] Successfully updated conditions with new check-in time");
    } else {
      console.log("[CHECK-IN] No active conditions found for user");
    }
    
    return createSuccessResponse({
      timestamp: now,
      method: method,
      conditions_updated: conditionsData?.length || 0
    });
    
  } catch (error) {
    return createErrorResponse(error);
  }
});
