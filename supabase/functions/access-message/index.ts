
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { supabaseClient } from "./supabase-client.ts";

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
  const supabase = supabaseClient();
  
  try {
    // Validate the message ID format
    if (messageId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(messageId)) {
        console.error(`[AccessMessage] Invalid message ID format: ${messageId}`);
        return new Response(
          JSON.stringify({ 
            error: "Invalid message ID format", 
            details: `Message ID ${messageId} is not a valid UUID`,
            message_id: messageId 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
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
          JSON.stringify({ 
            error: `Error fetching message: ${messageError.message}`,
            message_id: messageId,
            query_details: "SELECT * FROM messages WHERE id = '" + messageId + "'"
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
        
      if (!message) {
        console.error(`[AccessMessage] Message not found in bypass mode: ${messageId}`);
        
        // Try to get any messages to see if the database is working
        try {
          const { data: anyMessages } = await supabase
            .from("messages")
            .select("id")
            .limit(3);
            
          const availableIds = anyMessages?.map(m => m.id) || [];
          
          return new Response(
            JSON.stringify({ 
              error: "Message not found", 
              message_id: messageId,
              available_ids: availableIds,
              help: "These message IDs exist in the database. Try one of them."
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        } catch (anyError) {
          console.error("[AccessMessage] Error checking for any messages:", anyError);
        }
        
        return new Response(
          JSON.stringify({ error: "Message not found", message_id: messageId }),
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
    
    // Verify delivery record exists - CRUCIAL FIX: No type comparison on delivery_id field
    // We're explicitly NOT using .eq('delivery_id', deliveryId) as in some cases deliveryId could be 
    // a string while the column is UUID, or vice-versa
    console.log(`[AccessMessage] Checking delivery record with TEXT comparison - message_id: ${messageId}, delivery_id: ${deliveryId}`);
    
    // Use a text-mode filter to compare - safer for mixed type scenarios
    const deliveryQuery = `
      delivery_id::text = '${deliveryId}'::text 
      AND message_id::text = '${messageId}'::text
    `;
    
    // CRITICAL FIX: Change const to let for deliveryData to allow reassignment in the fallback logic
    let { data: deliveryData, error: deliveryError } = await supabase
      .from('delivered_messages')
      .select('*')
      .or(deliveryQuery)
      .maybeSingle();
      
    if (deliveryError) {
      console.error(`[AccessMessage] Error querying delivery: ${deliveryError.message}`);
      
      // Try direct query with proper text casting
      console.log("[AccessMessage] Trying fallback query with explicit type casts");
      
      // Attempt a direct query with explicit casting
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('delivered_messages')
        .select('*')
        .filter('delivery_id', 'eq', deliveryId)
        .filter('message_id', 'eq', messageId)
        .maybeSingle();
        
      if (fallbackError || !fallbackData) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid or expired access link: ${deliveryError.message}`,
            fallback_error: fallbackError?.message,
            attempted_delivery_id: deliveryId,
            attempted_message_id: messageId
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // If we got here, the fallback worked
      console.log(`[AccessMessage] Fallback query succeeded - delivery found!`);
      deliveryData = fallbackData;
    } 
    
    if (!deliveryData) {
      console.error(`[AccessMessage] No delivery record found for: delivery=${deliveryId}, message=${messageId}`);
      
      // Diagnostic query to look for similar records
      const { data: similarDeliveries, error: similarError } = await supabase
        .from('delivered_messages')
        .select('delivery_id, message_id')
        .or(`delivery_id::text LIKE '%${deliveryId.substring(0, 8)}%',message_id::text = '${messageId}'::text`)
        .limit(5);
        
      if (similarDeliveries && similarDeliveries.length > 0) {
        console.log(`[AccessMessage] Found similar delivery records: ${JSON.stringify(similarDeliveries)}`);
      }
      
      // Try looking up by just message ID as a fallback
      const { data: messageOnlyDelivery } = await supabase
        .from('delivered_messages')
        .select('*')
        .eq('message_id', messageId)
        .limit(1);
        
      if (messageOnlyDelivery && messageOnlyDelivery.length > 0) {
        console.log(`[AccessMessage] Found delivery by message ID: ${JSON.stringify(messageOnlyDelivery[0])}`);
        return new Response(
          JSON.stringify({ 
            error: "Invalid delivery ID", 
            details: "Found message but delivery ID doesn't match",
            correct_delivery_id: messageOnlyDelivery[0].delivery_id,
            provided_delivery_id: deliveryId
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Check if the message exists at all
      const { data: messageCheck, error: messageCheckError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .maybeSingle();
        
      if (messageCheckError) {
        console.error(`[AccessMessage] Error checking message existence: ${messageCheckError.message}`);
      } else if (!messageCheck) {
        console.log(`[AccessMessage] Message ${messageId} does not exist`);
        return new Response(
          JSON.stringify({ 
            error: "Message not found", 
            details: "The message ID does not exist in the database"
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } else {
        console.log(`[AccessMessage] Message exists but no delivery record found`);
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired access link. Delivery record not found.",
          diagnostics: {
            similar_records: similarDeliveries || [],
            delivery_id_type: typeof deliveryId,
            message_id_type: typeof messageId
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
      // Try fallback lookup by email
      const { data: recipientByEmail, error: recipientByEmailError } = await supabase
        .from('recipients')
        .select('id, email')
        .eq('email', decodeURIComponent(recipientEmail))
        .maybeSingle();
        
      if (!recipientByEmailError && recipientByEmail) {
        console.log(`[AccessMessage] Found recipient by email: ${JSON.stringify(recipientByEmail)}`);
        // Use this recipient instead
        recipientData = recipientByEmail;
      } else {
        return new Response(
          JSON.stringify({ error: `Invalid recipient: ${recipientError.message}` }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
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
      .eq('id', deliveryData.id);
      
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
        JSON.stringify({ 
          error: `Error fetching message: ${messageError.message}`,
          query: `SELECT * FROM messages WHERE id = '${messageId}'` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
      
    if (!messageData) {
      console.error(`[AccessMessage] Message not found: ${messageId}`);
      
      // Try to find any messages as a diagnostic step
      const { data: anyMessages } = await supabase
        .from('messages')
        .select('id')
        .limit(5);
        
      return new Response(
        JSON.stringify({ 
          error: "Message not found", 
          details: `No message found with ID: ${messageId}`,
          sample_ids: anyMessages?.map(m => m.id) || [] 
        }),
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
