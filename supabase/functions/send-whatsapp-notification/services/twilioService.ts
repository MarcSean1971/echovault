
import { corsHeaders } from "../utils/cors.ts";
import { getTwilioCredentials } from "../utils/env.ts";

/**
 * Send a message using the Twilio API with retry mechanism
 * @param formData The form data to send to Twilio
 * @param useTemplate Whether to use a template
 * @returns Response data from Twilio
 */
export async function sendTwilioMessage(formData: URLSearchParams, useTemplate: boolean = false) {
  const { accountSid, authToken } = getTwilioCredentials();
  
  // Create base64 encoded auth header
  const authHeader = btoa(`${accountSid}:${authToken}`);
  
  // Construct the request URL for Twilio API based on message type
  let twilioApiUrl;
  if (useTemplate) {
    // For templates, use the Conversations API
    twilioApiUrl = `https://conversations.twilio.com/v1/Conversations`;
  } else {
    // For regular messages, use the standard Messages API
    twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  }
  
  // Make the request to Twilio API with retry logic
  const maxRetries = 2;
  let attempt = 0;
  let response;
  let responseData;
  
  while (attempt <= maxRetries) {
    try {
      console.log(`Attempt ${attempt + 1}: Sending to Twilio API: ${twilioApiUrl}`);
      console.log(`Using template: ${useTemplate ? "Yes" : "No"}`);
      
      response = await fetch(twilioApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      console.log(`Response status: ${response.status}`);
      console.log(`Response text: ${responseText}`);
      
      // Parse the response text as JSON if possible
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`Error parsing response as JSON: ${jsonError.message}`);
        responseData = { error: true, rawResponse: responseText };
      }
      
      if (response.ok) {
        console.log("WhatsApp message sent successfully:", useTemplate ? responseData.sid : responseData.sid);
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
  
  return responseData;
}

/**
 * Create a success response for client
 * @param responseData The Twilio response data
 * @param useTemplate Whether a template was used
 * @param templateId The template ID if applicable
 * @returns Formatted success response
 */
export function createSuccessResponse(responseData: any, useTemplate: boolean, templateId: string | undefined) {
  return new Response(
    JSON.stringify({ 
      success: true,
      messageId: responseData.sid,
      status: useTemplate ? responseData.state : responseData.status,
      usingTemplate: useTemplate,
      templateId: useTemplate ? templateId : null,
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
}
