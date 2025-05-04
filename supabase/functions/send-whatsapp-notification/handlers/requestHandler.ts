
import { corsHeaders } from "../utils/cors.ts";
import { getTwilioCredentials } from "../utils/env.ts";

/**
 * Parse request body and extract WhatsApp message data
 * @param req The HTTP request
 * @returns Parsed WhatsApp message request data
 */
async function parseRequestBody(req: Request): Promise<any> {
  try {
    const bodyText = await req.text();
    return JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`Invalid request body format: ${error.message}`);
  }
}

/**
 * Main request handler for WhatsApp notifications
 * @param req The HTTP request
 * @returns HTTP response
 */
export async function handleRequest(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get Twilio credentials
    const { accountSid, authToken, messagingServiceSid } = getTwilioCredentials();
    
    // Parse the request body
    const requestData = await parseRequestBody(req);
    console.log("WhatsApp notification request:", JSON.stringify(requestData, null, 2));
    
    // If this is a template request, use the direct approach like the example
    if (requestData.useTemplate) {
      const recipientPhone = requestData.recipientPhone || requestData.to;
      const senderName = requestData.senderName;
      const recipientName = requestData.recipientName;
      const locationText = requestData.locationText || "";
      const locationLink = requestData.locationLink || "";
      const templateId = requestData.templateId || "HX4386568436c1f993dd47146448194dd8";
      
      console.log(`Sending template to ${recipientPhone} using template ${templateId}`);
      
      // Ensure proper phone formatting (adding whatsapp: prefix if needed)
      const formattedTo = recipientPhone.startsWith("whatsapp:") ? 
        recipientPhone : 
        `whatsapp:${recipientPhone.startsWith("+") ? recipientPhone : "+" + recipientPhone}`;
      
      // Create payload exactly like the working example
      const payload = new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: formattedTo,
        From: "whatsapp:+14155238886",
        ContentTemplateSid: templateId,
        Attributes: JSON.stringify({
          parameters: {
            "1": senderName,
            "2": recipientName,
            "3": locationText,
            "4": locationLink
          }
        })
      });
      
      console.log("Sending request to Twilio with payload:", payload.toString());
      
      // Send the request directly to Twilio Conversations API
      const response = await fetch("https://conversations.twilio.com/v1/Conversations", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload
      });
      
      const responseText = await response.text();
      console.log(`Response status: ${response.status}`);
      console.log(`Response text: ${responseText}`);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Twilio error: ${responseData.message || responseText}`,
            timestamp: new Date().toISOString() 
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          sid: responseData.sid,
          status: responseData.state || "sent",
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    // For non-template messages, use a simplified approach
    const { to, message } = requestData;
  
    console.log(`Sending regular WhatsApp message to: ${to}`);
    
    // Ensure proper phone formatting
    const formattedTo = to.startsWith("whatsapp:") ? 
      to : 
      `whatsapp:${to.startsWith("+") ? to : "+" + to.replace(/\D/g, '')}`;
    
    // Send using standard Messages API
    const { twilioWhatsappNumber } = getTwilioCredentials();
    const formattedFrom = `whatsapp:${twilioWhatsappNumber.replace('whatsapp:', '')}`;
    
    const messagePayload = new URLSearchParams({
      To: formattedTo,
      From: formattedFrom,
      Body: message || "Test message from your app"
    });
    
    console.log(`Sending message from ${formattedFrom} to ${formattedTo}`);
    
    const messageResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: messagePayload
    });
    
    const messageResponseText = await messageResponse.text();
    console.log(`Message response status: ${messageResponse.status}`);
    console.log(`Message response: ${messageResponseText}`);
    
    let messageResponseData;
    try {
      messageResponseData = JSON.parse(messageResponseText);
    } catch {
      messageResponseData = { rawResponse: messageResponseText };
    }
    
    if (!messageResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Twilio error: ${messageResponseData.message || messageResponseText}`,
          timestamp: new Date().toISOString() 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        sid: messageResponseData.sid,
        status: messageResponseData.status || "sent",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
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
}
