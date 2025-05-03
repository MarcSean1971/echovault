
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
      const contentType = req.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        requestData = await req.json();
      } else {
        throw new Error("Unsupported content type. Expected application/json");
      }
      
      console.log("Received WhatsApp notification request:", JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error("Invalid request body. Expected JSON object with 'to' and 'message' fields.");
    }

    const { to, message, messageId, recipientName, isEmergency, triggerKeyword } = requestData;
    
    if (!to || !message) {
      throw new Error("Missing required parameters: 'to' phone number and 'message' are required.");
    }
    
    console.log(`Sending WhatsApp message to: ${to}`);
    
    // Process phone number to ensure consistency
    // Standardize phone number format - handle various formats and make sure it has + prefix
    let normalizedPhoneNumber = to.replace("whatsapp:", "").trim();
    if (!normalizedPhoneNumber.startsWith("+")) {
      normalizedPhoneNumber = "+" + normalizedPhoneNumber.replace(/^0/, ""); // Replace leading 0 with +
    }
    
    // Format the WhatsApp number correctly (make sure it has the whatsapp: prefix)
    const formattedTo = `whatsapp:${normalizedPhoneNumber}`;
    const formattedFrom = twilioWhatsappNumber.startsWith('whatsapp:') ? 
      twilioWhatsappNumber : `whatsapp:${twilioWhatsappNumber}`;
      
    // The message already includes the emergency formatting and sender name from the calling function
    const finalMessage = recipientName 
      ? `Hello ${recipientName}, ${message}`
      : message;
      
    // Add trigger keyword information if provided
    const completeMessage = triggerKeyword 
      ? `${finalMessage}\n\nTo trigger this alert in an emergency, send "${triggerKeyword}" to this number.`
      : finalMessage;
    
    // Construct the request URL for Twilio API
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Create base64 encoded auth header
    const authHeader = btoa(`${accountSid}:${authToken}`);
    
    // Make the request to Twilio API with retry logic
    let maxRetries = 2;
    let attempt = 0;
    let response;
    let responseData;
    
    while (attempt <= maxRetries) {
      try {
        response = await fetch(twilioApiUrl, {
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
        
        responseData = await response.json();
        
        if (response.ok) {
          console.log("WhatsApp message sent successfully:", responseData.sid);
          break; // Success, exit retry loop
        } else {
          throw new Error(`Twilio API error: ${responseData.message || "Unknown error"}`);
        }
      } catch (error) {
        attempt++;
        console.error(`Twilio API error (attempt ${attempt}/${maxRetries + 1}):`, error);
        
        if (attempt > maxRetries) {
          throw error; // Re-throw after max retries
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
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
