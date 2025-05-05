
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request): Promise<Response> => {
  console.log("[AccessMessage] Request received:", req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[AccessMessage] Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);
  
  console.log(`[AccessMessage] Path: ${url.pathname}`);
  console.log(`[AccessMessage] Method: ${req.method}`);
  console.log(`[AccessMessage] Path parts: ${JSON.stringify(path)}`);
  console.log(`[AccessMessage] Query parameters: ${url.search}`);
  
  let messageId, deliveryId, recipientEmail, bypassSecurity = false;
  
  // Extract parameters from URL path or from request body
  if (req.method === 'POST') {
    try {
      const requestData = await req.json();
      console.log(`[AccessMessage] Request body: ${JSON.stringify(requestData)}`);
      
      messageId = requestData.messageId;
      deliveryId = requestData.deliveryId;
      recipientEmail = requestData.recipientEmail;
      bypassSecurity = requestData.bypassSecurity === true;
      
      console.log(`[AccessMessage] Extracted from body - Message ID: ${messageId}, Delivery ID: ${deliveryId}, Recipient: ${recipientEmail}`);
    } catch (jsonError) {
      console.error('[AccessMessage] Error parsing request body:', jsonError);
    }
  } else if (path.length >= 2 && path[0] === 'message') {
    messageId = path[1];
    deliveryId = url.searchParams.get('delivery');
    recipientEmail = url.searchParams.get('recipient');
    bypassSecurity = url.searchParams.get('bypass') === 'true';
    
    console.log(`[AccessMessage] Extracted from URL - Message ID: ${messageId}, Delivery ID: ${deliveryId}, Recipient: ${recipientEmail}`);
  }
  
  // Initialize Supabase client with service role key for admin access
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[AccessMessage] Missing required environment variables');
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
  
  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
  );
  
  try {
    // Special diagnostic bypass mode
    if (bypassSecurity) {
      console.log(`[AccessMessage] BYPASS SECURITY MODE activated for message: ${messageId}`);
      
      if (!messageId) {
        return new Response(
          JSON.stringify({ error: "Message ID is required even in bypass mode" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Get the message content directly without verification
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .maybeSingle();
        
      if (messageError) {
        console.error(`[AccessMessage] Error fetching message in bypass mode: ${messageError.message}`);
        return new Response(
          JSON.stringify({ error: `Error fetching message: ${messageError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
        
      if (!message) {
        console.error(`[AccessMessage] Message not found in bypass mode: ${messageId}`);
        return new Response(
          JSON.stringify({ error: "Message not found" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log(`[AccessMessage] Successfully retrieved message in bypass mode: ${messageId}`);
      return new Response(
        JSON.stringify({
          success: true,
          message,
          bypass_mode: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Regular message access verification
    if (!messageId || !deliveryId || !recipientEmail) {
      console.error("[AccessMessage] Missing required parameters");
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameters", 
          provided: { 
            messageId: messageId || "(missing)",
            deliveryId: deliveryId || "(missing)",
            recipientEmail: recipientEmail || "(missing)" 
          }
        }),
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
      
    if (deliveryError) {
      console.error(`[AccessMessage] Error querying delivery: ${deliveryError.message}`);
      return new Response(
        JSON.stringify({ error: `Invalid or expired access link: ${deliveryError.message}` }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } 
    
    if (!deliveryData) {
      console.error(`[AccessMessage] No delivery record found for: delivery=${deliveryId}, message=${messageId}`);
      
      // Diagnostic query to look for similar records
      const { data: similarDeliveries, error: similarError } = await supabase
        .from('delivered_messages')
        .select('delivery_id, message_id')
        .or(`delivery_id.eq.${deliveryId},message_id.eq.${messageId}`)
        .limit(5);
        
      if (similarDeliveries && similarDeliveries.length > 0) {
        console.log(`[AccessMessage] Found similar delivery records: ${JSON.stringify(similarDeliveries)}`);
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired access link. Delivery record not found.",
          diagnostics: {
            similar_records: similarDeliveries || []
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`[AccessMessage] Found delivery record: ${JSON.stringify(deliveryData)}`);
    
    // Verify recipient matches
    const { data: recipientData, error: recipientError } = await supabase
      .from('recipients')
      .select('email')
      .eq('id', deliveryData.recipient_id)
      .maybeSingle();
      
    if (recipientError) {
      console.error(`[AccessMessage] Recipient lookup error: ${recipientError.message}`);
      return new Response(
        JSON.stringify({ error: `Invalid recipient: ${recipientError.message}` }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    if (!recipientData) {
      console.error(`[AccessMessage] No recipient found with ID: ${deliveryData.recipient_id}`);
      return new Response(
        JSON.stringify({ error: "Invalid recipient. Recipient record not found." }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`[AccessMessage] Found recipient: ${JSON.stringify(recipientData)}`);
    
    // Compare emails with case-insensitive matching
    const dbEmail = recipientData.email.toLowerCase();
    const providedEmail = decodeURIComponent(recipientEmail).toLowerCase();
    
    console.log(`[AccessMessage] Comparing emails - DB: '${dbEmail}', Request: '${providedEmail}'`);
    
    if (dbEmail !== providedEmail) {
      console.error(`[AccessMessage] Email mismatch: DB=${dbEmail}, Request=${providedEmail}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized access attempt. Email does not match." }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`[AccessMessage] Email verification successful`);
    
    // Get message conditions if any
    const { data: conditionData, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('id', deliveryData.condition_id)
      .maybeSingle();
      
    if (conditionError) {
      console.error(`[AccessMessage] Error fetching conditions: ${conditionError.message}`);
    } else {
      console.log(`[AccessMessage] Found message conditions: ${JSON.stringify(conditionData || {})}`);
    }
    
    // Update delivery record with view info
    const viewTime = new Date().toISOString();
    const viewCount = (deliveryData.viewed_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('delivered_messages')
      .update({ 
        viewed_at: deliveryData.viewed_at || viewTime,
        viewed_count: viewCount
      })
      .eq('delivery_id', deliveryId);
      
    if (updateError) {
      console.error(`[AccessMessage] Error updating view count: ${updateError.message}`);
    } else {
      console.log(`[AccessMessage] Updated view count to ${viewCount}`);
    }
    
    // Get the message content
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .maybeSingle();
      
    if (messageError) {
      console.error(`[AccessMessage] Error fetching message: ${messageError.message}`);
      return new Response(
        JSON.stringify({ error: `Error fetching message: ${messageError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
      
    if (!messageData) {
      console.error(`[AccessMessage] Message not found: ${messageId}`);
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Return success with all necessary data
    console.log(`[AccessMessage] Successfully verified access to message: ${messageId}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: messageData,
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
  } catch (error) {
    console.error(`[AccessMessage] Unhandled error: ${error.message}`);
    console.error(error.stack);
    
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
