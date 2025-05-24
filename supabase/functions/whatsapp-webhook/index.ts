import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { processCheckIn } from "./services/check-in-service.ts";
import { processPanicTrigger } from "./services/panic-service.ts";
import { createSupabaseAdmin } from "../shared/services/whatsapp-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/**
 * Parse incoming webhook data - handles both JSON and form-encoded payloads
 */
async function parseWebhookData(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  
  console.log(`[WEBHOOK] Content-Type: ${contentType}`);
  
  try {
    // Handle form-encoded data (typical for Twilio webhooks)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const body: Record<string, string> = {};
      
      for (const [key, value] of formData.entries()) {
        body[key] = value.toString();
      }
      
      console.log("[WEBHOOK] Parsed form data:", JSON.stringify(body, null, 2));
      return body;
    }
    
    // Handle JSON data
    if (contentType.includes('application/json')) {
      const body = await req.json();
      console.log("[WEBHOOK] Parsed JSON data:", JSON.stringify(body, null, 2));
      return body;
    }
    
    // Fallback: try to parse as text and then as form data
    const text = await req.text();
    console.log(`[WEBHOOK] Raw text data: ${text}`);
    
    // Try to parse as URL-encoded form data
    if (text.includes('=') && text.includes('&')) {
      const params = new URLSearchParams(text);
      const body: Record<string, string> = {};
      
      for (const [key, value] of params.entries()) {
        body[key] = value;
      }
      
      console.log("[WEBHOOK] Parsed URL-encoded data:", JSON.stringify(body, null, 2));
      return body;
    }
    
    // If all else fails, try JSON
    return JSON.parse(text);
    
  } catch (error) {
    console.error("[WEBHOOK] Error parsing request data:", error);
    throw new Error(`Failed to parse request data: ${error.message}`);
  }
}

/**
 * Find user by phone number using multiple lookup strategies
 */
async function findUserByPhone(phone: string) {
  const supabase = createSupabaseAdmin();
  const cleanPhone = phone.replace('whatsapp:', '').replace('+', '').trim();
  
  console.log(`[WEBHOOK] Looking up user for phone: ${phone} (clean: ${cleanPhone})`);
  
  // Strategy 1: Direct profile lookup by whatsapp_number
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .or(`whatsapp_number.eq.${phone},whatsapp_number.eq.${cleanPhone},whatsapp_number.eq.+${cleanPhone}`)
    .single();
  
  if (!profileError && profileData) {
    console.log(`[WEBHOOK] Found user via profile: ${profileData.id}`);
    return profileData.id;
  }
  
  // Strategy 2: Recipients table lookup
  const { data: recipientData, error: recipientError } = await supabase
    .from('recipients')
    .select('user_id')
    .or(`phone.eq.${phone},phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`)
    .single();
  
  if (!recipientError && recipientData) {
    console.log(`[WEBHOOK] Found user via recipients: ${recipientData.user_id}`);
    return recipientData.user_id;
  }
  
  console.log(`[WEBHOOK] No user found for phone: ${phone}`);
  return null;
}

serve(async (req) => {
  console.log("[WEBHOOK] WhatsApp webhook received request");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[WEBHOOK] Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request data
    const body = await parseWebhookData(req);
    
    // If this is a verification request from WhatsApp/Twilio, handle it
    if (body.type === "verification") {
      console.log("[WEBHOOK] Handling verification request");
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
    
    console.log(`[WEBHOOK] Message from ${from} to ${to}: "${body_text}"`);
    
    if (!body_text) {
      console.log("[WEBHOOK] No message body found");
      return new Response(
        JSON.stringify({ success: true, message: "No message body" }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Find the user who sent this message
    const userId = await findUserByPhone(from);
    
    if (!userId) {
      console.log("[WEBHOOK] No user found for this phone number");
      return new Response(
        JSON.stringify({ success: false, error: "User not found for this phone number" }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Check if this is an SOS message (panic trigger) - this handles both new SOS and selection responses
    const messageUpper = body_text.toUpperCase().trim();
    if (messageUpper === 'SOS' || /^\d+$/.test(body_text.trim()) || ['CANCEL', 'ABORT', 'STOP'].includes(messageUpper)) {
      console.log("[WEBHOOK] Detected SOS panic trigger or selection response");
      
      const panicResult = await processPanicTrigger(userId, from, body_text);
      
      return new Response(
        JSON.stringify(panicResult),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Check if this is a check-in message
    if (messageUpper === 'CHECKIN' || messageUpper === 'CHECK' || messageUpper === 'OK' || messageUpper === 'OKOK') {
      console.log("[WEBHOOK] Detected check-in message");
      
      const checkInResult = await processCheckIn(userId, from);
      
      return new Response(
        JSON.stringify(checkInResult),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Check for custom check-in codes
    const supabase = createSupabaseAdmin();
    const { data: conditions, error: conditionsError } = await supabase
      .from('message_conditions')
      .select('id, message_id, check_in_code, messages!inner(user_id)')
      .eq('messages.user_id', userId)
      .eq('active', true)
      .not('check_in_code', 'is', null);
    
    if (!conditionsError && conditions && conditions.length > 0) {
      for (const condition of conditions) {
        if (condition.check_in_code && messageUpper === condition.check_in_code.toUpperCase()) {
          console.log(`[WEBHOOK] Detected custom check-in code: ${condition.check_in_code}`);
          
          const checkInResult = await processCheckIn(userId, from);
          
          return new Response(
            JSON.stringify(checkInResult),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    }
    
    // If no specific action was detected, acknowledge the message
    console.log("[WEBHOOK] No specific action detected for this message");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message received but no action taken",
        hint: "Send 'SOS' for emergency or 'CHECKIN' to check in"
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
