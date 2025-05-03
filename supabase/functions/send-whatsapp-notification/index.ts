
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioWhatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessageRequest {
  to: string;
  message: string;
  messageId?: string;
  recipientName?: string;
  isEmergency?: boolean;
  triggerKeyword?: string; // Add trigger keyword for template messages
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!accountSid || !authToken || !twilioWhatsappNumber) {
      throw new Error("Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER.");
    }

    // Parse the request body
    let requestData: WhatsAppMessageRequest;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error("Invalid request body. Expected JSON object with 'to' and 'message' fields.");
    }

    const { to, message, messageId, recipientName, isEmergency, triggerKeyword } = requestData;
    
    if (!to || !message) {
      throw new Error("Missing required parameters: 'to' phone number and 'message' are required.");
    }
    
    console.log(`Sending WhatsApp message to: ${to}`);
    
    // Format the WhatsApp number correctly (make sure it has the whatsapp: prefix)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = twilioWhatsappNumber.startsWith('whatsapp:') ? 
      twilioWhatsappNumber : `whatsapp:${twilioWhatsappNumber}`;
      
    // Determine the message text based on whether it's an emergency
    let messageText = isEmergency
      ? `⚠️ EMERGENCY ALERT: ${message}`
      : message;
    
    // Add recipient name if provided
    const finalMessage = recipientName 
      ? `Hello ${recipientName}, ${messageText}`
      : messageText;
      
    // Add trigger keyword information if provided
    const completeMessage = triggerKeyword 
      ? `${finalMessage}\n\nTo trigger this alert in an emergency, send "${triggerKeyword}" to this number.`
      : finalMessage;
    
    // Construct the request URL for Twilio API
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Create base64 encoded auth header
    const authHeader = btoa(`${accountSid}:${authToken}`);
    
    // Make the request to Twilio API
    const response = await fetch(twilioApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: formattedFrom,
        Body: completeMessage,
      }).toString(),
    });
    
    if (!response.ok) {
      const responseData = await response.json();
      console.error("Twilio API error:", responseData);
      throw new Error(`Twilio API error: ${responseData.message || "Unknown error"}`);
    }
    
    const responseData = await response.json();
    console.log("WhatsApp message sent successfully:", responseData.sid);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: responseData.sid,
        status: responseData.status,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-notification function:", error);
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
