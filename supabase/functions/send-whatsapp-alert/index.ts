
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get Twilio credentials from environment
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    
    if (!accountSid || !authToken || !messagingServiceSid) {
      throw new Error("Missing required Twilio credentials");
    }
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Get request parameters with defaults
    const to = body.to || ""; // e.g. whatsapp:+27796310601
    const templateSid = body.templateId || "HX4386568436c1f993dd47146448194dd8";
    const from = body.from || "whatsapp:+14155238886"; // Twilio WhatsApp sender
    
    // Extract template parameters or use defaults
    const param1 = body.params?.[0] || "Sender Name";
    const param2 = body.params?.[1] || "Recipient Name";
    const param3 = body.params?.[2] || "Location Information";
    const param4 = body.params?.[3] || "https://maps.example.com";
    
    console.log(`Sending template alert to ${to} using template ${templateSid}`);
    console.log(`Parameters: [${param1}, ${param2}, ${param3}, ${param4}]`);
    
    // Validate required parameters
    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required 'to' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Format the recipient number if it doesn't have the whatsapp: prefix
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    
    // Create the payload
    const payload = new URLSearchParams({
      MessagingServiceSid: messagingServiceSid,
      To: formattedTo,
      From: from,
      ContentTemplateSid: templateSid,
      Attributes: JSON.stringify({
        parameters: {
          "1": param1,
          "2": param2,
          "3": param3,
          "4": param4
        }
      })
    });
    
    // Log the request parameters for debugging
    console.log("Request parameters:");
    payload.forEach((value, key) => {
      if (key === "Attributes") {
        console.log(`  ${key}: [JSON Object]`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    // Send the request to Twilio
    const response = await fetch("https://conversations.twilio.com/v1/Conversations", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload
    });
    
    // Get the response
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response: ${responseText}`);
    
    // Parse the JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing response:", error);
      responseData = { rawResponse: responseText };
    }
    
    // Return success or error
    if (response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          sid: responseData.sid,
          status: responseData.state || "sent",
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.message || "Unknown error",
          details: responseData,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
  } catch (error) {
    console.error("Error in send-whatsapp-alert function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
