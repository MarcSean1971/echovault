
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { processCheckIn } from "./services/check-in-service.ts";
import { createSupabaseAdmin } from "../shared/services/whatsapp-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log("[WEBHOOK] WhatsApp webhook received request");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[WEBHOOK] Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("[WEBHOOK] Processing request body");
    
    // Parse the request body
    const body = await req.json();
    
    // Log the request for debugging
    console.log("[WEBHOOK] Request body:", JSON.stringify(body));
    
    // If this is a verification request from WhatsApp/Twilio, handle it
    if (body.type === "verification") {
      console.log("[WEBHOOK] Handling verification request");
      
      // Verify that the request is legitimate (in a real implementation you would validate the challenge)
      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Extract message information from the request
    const smsMessage = body.SmsMessageSid || body.MessageSid;
    const from = body.From || '';
    const to = body.To || '';
    const body_text = body.Body || '';
    
    console.log(`[WEBHOOK] Message from ${from} to ${to}: ${body_text}`);
    
    // Check if this is a check-in message
    if (body_text && (body_text.toUpperCase() === 'CHECKIN' || body_text.toUpperCase().includes('CHECK') || body_text.toUpperCase().includes('OK'))) {
      console.log("[WEBHOOK] Detected check-in message");
      
      // Extract the user ID from the phone number
      // In a real implementation, you would look up the user based on the phone number
      // For now, we'll use a database query to find the user
      const supabase = createSupabaseAdmin();
      
      // Remove WhatsApp prefix and any spaces
      const cleanPhone = from.replace('whatsapp:', '').trim();
      
      // Look up the profile by phone number
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('whatsapp_number', cleanPhone)
        .single();
      
      if (profileError || !profileData) {
        console.error("[WEBHOOK] Error finding user by phone number:", profileError || "No user found");
        
        // Try an alternative lookup method - find the user through recipients table
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .select('user_id')
          .eq('phone', cleanPhone)
          .single();
        
        if (recipientError || !recipientData) {
          console.error("[WEBHOOK] Error finding user through recipients:", recipientError || "No recipient found");
          return new Response(
            JSON.stringify({ success: false, error: "User not found" }),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        // Process the check-in for the user found through recipients
        const result = await processCheckIn(recipientData.user_id, cleanPhone);
        
        return new Response(
          JSON.stringify(result),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Process the check-in for the user
      const result = await processCheckIn(profileData.id, cleanPhone);
      
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // If this is a message with a verification code or other structured info
    if (body_text && body_text.toUpperCase().includes('OKOK')) {
      console.log("[WEBHOOK] Received message with check-in code OKOK");
      
      // Handle this similarly to the check-in flow
      // Get the user ID based on the phone number
      const supabase = createSupabaseAdmin();
      const cleanPhone = from.replace('whatsapp:', '').trim();
      
      // Find users with active check-in conditions and this check-in code
      const { data: conditions, error: conditionsError } = await supabase
        .from('message_conditions')
        .select('id, message_id, user_id:messages(user_id)')
        .eq('check_in_code', 'OKOK')
        .eq('active', true);
      
      if (conditionsError || !conditions || conditions.length === 0) {
        console.error("[WEBHOOK] No active conditions with matching code found:", conditionsError || "No conditions found");
        return new Response(
          JSON.stringify({ success: false, error: "No matching conditions found" }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Use the user_id from the first matching condition
      const userId = conditions[0].user_id?.user_id;
      
      if (!userId) {
        console.error("[WEBHOOK] Could not determine user ID for check-in");
        return new Response(
          JSON.stringify({ success: false, error: "User ID not found" }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Process the check-in
      const result = await processCheckIn(userId, cleanPhone);
      
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // If nothing specific was detected, just acknowledge the message
    console.log("[WEBHOOK] No specific action detected for this message");
    return new Response(
      JSON.stringify({ success: true, message: "Message received" }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
