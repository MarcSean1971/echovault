
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple response creators
const createSuccessResponse = (data: any) => new Response(
  JSON.stringify({ success: true, data }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
);

const createErrorResponse = (error: any) => new Response(
  JSON.stringify({ success: false, error: error.message || String(error) }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const body = await req.json();
    const { messageId } = body;
    
    if (!messageId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing messageId parameter" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[DEADMAN-SWITCH] Triggered for message ${messageId}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Get the message and its active condition
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();
    
    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message || "Unknown error"}`);
    }
    
    // 2. Get the active condition for this message
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("message_id", messageId)
      .eq("active", true)
      .single();
    
    if (conditionError) {
      throw new Error(`Condition not found: ${conditionError.message}`);
    }
    
    if (!condition) {
      throw new Error("No active condition found for this message");
    }
    
    // 3. Check if it's a deadman's switch condition
    if (condition.condition_type !== 'no_check_in') {
      throw new Error(`This is not a deadman's switch condition (type: ${condition.condition_type})`);
    }
    
    // 4. Create delivery records for all recipients
    if (!condition.recipients || !Array.isArray(condition.recipients) || condition.recipients.length === 0) {
      throw new Error("No recipients found for this message");
    }
    
    const deliveries = [];
    
    for (const recipient of condition.recipients) {
      const deliveryId = crypto.randomUUID();
      
      // Create delivery record
      const { data: delivery, error: deliveryError } = await supabase
        .from("delivered_messages")
        .insert({
          message_id: messageId,
          condition_id: condition.id,
          recipient_id: recipient.id,
          delivery_id: deliveryId
        })
        .select()
        .single();
      
      if (deliveryError) {
        console.error(`Failed to create delivery for recipient ${recipient.id}:`, deliveryError);
        // Continue with other recipients even if one fails
      } else {
        deliveries.push(delivery);
      }
    }
    
    // 5. Mark condition as inactive (message delivered)
    const { error: updateError } = await supabase
      .from("message_conditions")
      .update({ active: false })
      .eq("id", condition.id);
    
    if (updateError) {
      console.error("Failed to mark condition as inactive:", updateError);
      // Continue anyway as the message has been delivered
    }
    
    // 6. Return success response
    return createSuccessResponse({
      message: `Deadman's switch triggered for message ${messageId}`,
      deliveries_created: deliveries.length,
      condition_deactivated: !updateError,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[DEADMAN-SWITCH] Error:", error);
    return createErrorResponse(error);
  }
});
