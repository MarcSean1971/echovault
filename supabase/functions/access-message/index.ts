
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);
  
  console.log(`[AccessMessage] Path: ${url.pathname}`);
  console.log(`[AccessMessage] Method: ${req.method}`);
  
  // Initialize Supabase client with service role key for admin access
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  
  try {
    // Message endpoint - verify message access
    if (path.length >= 2 && path[0] === 'message') {
      const messageId = path[1];
      const deliveryId = url.searchParams.get('delivery');
      const recipientEmail = url.searchParams.get('recipient');
      
      if (!messageId || !deliveryId || !recipientEmail) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log(`[AccessMessage] Verifying access: ${messageId}, ${deliveryId}, ${recipientEmail}`);
      
      // Verify delivery record exists
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivered_messages')
        .select('*')
        .eq('delivery_id', deliveryId)
        .eq('message_id', messageId)
        .maybeSingle();
        
      if (deliveryError || !deliveryData) {
        console.error(`[AccessMessage] Invalid delivery record: ${deliveryError?.message || "Not found"}`);
        return new Response(
          JSON.stringify({ error: "Invalid or expired access link" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Verify recipient matches
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipients')
        .select('email')
        .eq('id', deliveryData.recipient_id)
        .maybeSingle();
        
      if (recipientError || !recipientData) {
        console.error(`[AccessMessage] Recipient not found: ${recipientError?.message || "Not found"}`);
        return new Response(
          JSON.stringify({ error: "Invalid recipient" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Compare emails with case-insensitive matching
      const dbEmail = recipientData.email.toLowerCase();
      const providedEmail = decodeURIComponent(recipientEmail).toLowerCase();
      
      if (dbEmail !== providedEmail) {
        console.error(`[AccessMessage] Email mismatch: DB=${dbEmail}, Request=${providedEmail}`);
        return new Response(
          JSON.stringify({ error: "Unauthorized access attempt" }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Get message conditions if any
      const { data: conditionData, error: conditionError } = await supabase
        .from('message_conditions')
        .select('*')
        .eq('id', deliveryData.condition_id)
        .maybeSingle();
        
      if (conditionError) {
        console.error(`[AccessMessage] Error fetching conditions: ${conditionError.message}`);
      }
      
      // Update delivery record with view info
      const viewTime = new Date().toISOString();
      const viewCount = (deliveryData.viewed_count || 0) + 1;
      
      await supabase
        .from('delivered_messages')
        .update({ 
          viewed_at: deliveryData.viewed_at || viewTime,
          viewed_count: viewCount
        })
        .eq('delivery_id', deliveryId);
      
      // Return success with conditions data
      return new Response(
        JSON.stringify({
          success: true,
          delivery: {
            ...deliveryData,
            viewed_count: viewCount
          },
          conditions: conditionData || null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Default handler - not found
    console.log("[AccessMessage] No matching route found");
    return new Response(
      JSON.stringify({ error: "Not found", path: path.join('/') }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in access-message function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error", 
        stack: error.stack,
        path: url.pathname
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
