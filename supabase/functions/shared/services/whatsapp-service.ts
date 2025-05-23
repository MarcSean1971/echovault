
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

/**
 * Send a WhatsApp message using the Twilio API
 * @param params Parameters for the WhatsApp message
 * @returns Success status and details
 */
export async function sendWhatsAppMessage(params: {
  to: string;
  message?: string;
  useTemplate?: boolean;
  templateId?: string;
  templateParams?: any[];
  languageCode?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string; status?: string; usingTemplate?: boolean; templateId?: string }> {
  const { to, message, useTemplate, templateId, templateParams, languageCode = "en_US" } = params;
  
  try {
    // Validate basic parameters
    if (!to) {
      console.error("Missing 'to' parameter for WhatsApp message");
      return { success: false, error: "Missing recipient phone number" };
    }
    
    if (!message && (!useTemplate || !templateId)) {
      console.error("Missing message content or template configuration");
      return { success: false, error: "Missing message content or template configuration" };
    }
    
    // Format phone number to ensure WhatsApp format
    let formattedPhone = to;
    
    // Ensure WhatsApp: prefix is present
    if (!formattedPhone.startsWith('whatsapp:')) {
      formattedPhone = `whatsapp:${formattedPhone.replace('whatsapp:', '')}`;
    }
    
    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
    
    if (!accountSid || !authToken) {
      console.error("Missing Twilio credentials");
      return { success: false, error: "Missing Twilio credentials" };
    }
    
    // Determine the message content and endpoint
    let twilioEndpoint: string;
    let requestBody: any;
    let contentType: string;
    
    // ENHANCED ERROR HANDLING: Implement retry mechanism
    const maxRetries = 2;
    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt <= maxRetries) {
      try {
        // Delay for retries
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          console.log(`Retry attempt ${attempt} for sending WhatsApp message to ${to}`);
        }
        attempt++;
        
        // Implement different strategies based on template vs regular message
        if (useTemplate && templateId) {
          console.log(`Sending WhatsApp template message to ${formattedPhone} using template ${templateId}`);
          
          // Use the Content API for templates
          twilioEndpoint = `https://content.twilio.com/v1/Content`;
          
          // Create attributes for template parameters
          const attributes = {
            language: languageCode,
            parameters: {}
          };
          
          // Add parameters if available
          if (templateParams && templateParams.length > 0) {
            templateParams.forEach((param, index) => {
              attributes.parameters[`${index + 1}`] = param;
            });
          }
          
          // Create the request body for template messages
          requestBody = {
            contentSid: templateId,
            to: formattedPhone,
            messagingServiceSid: messagingServiceSid,
            contentVariables: JSON.stringify(attributes)
          };
          
          contentType = "application/x-www-form-urlencoded";
          
          // Log the template parameters for debugging
          console.log(`Template parameters:`, JSON.stringify(attributes));
        } else {
          console.log(`Sending WhatsApp text message to ${formattedPhone}`);
          
          // Use the standard Messages API for text messages
          twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          
          // Create the request body for text messages
          requestBody = {
            To: formattedPhone,
            Body: message,
            From: whatsappNumber || formattedPhone.replace("whatsapp:", ""),
          };
          
          if (messagingServiceSid) {
            requestBody.MessagingServiceSid = messagingServiceSid;
          }
          
          contentType = "application/x-www-form-urlencoded";
        }
        
        // Create the authorization header
        const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
        
        // Convert the request body to a URL-encoded string
        const formBody = Object.entries(requestBody)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        
        // Send the request to Twilio
        const response = await fetch(twilioEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
            'Authorization': authHeader,
          },
          body: formBody,
        });
        
        // Log the response status for debugging
        console.log(`Response status: ${response.status}`);
        
        // Get the response text
        const responseText = await response.text();
        console.log(`Response text: ${responseText}`);
        
        // Check for errors in the response
        if (response.status >= 400) {
          console.error(`WhatsApp message failed. Status: ${response.status}, Response: ${responseText}`);
          lastError = new Error(`Failed to send WhatsApp message: ${responseText}`);
          continue; // Retry on error
        }
        
        // Parse the response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          lastError = parseError;
          continue; // Retry on parse error
        }
        
        // Extract message ID from the response
        const messageId = data.sid || data.content_sid || null;
        
        console.log(`WhatsApp message sent successfully: ${messageId}`);
        
        // Return success response
        return { 
          success: true, 
          messageId: messageId,
          status: data.status || 'sent',
          usingTemplate: !!useTemplate,
          templateId: useTemplate ? templateId : null
        };
      } catch (error) {
        console.error(`Error sending WhatsApp message (attempt ${attempt}/${maxRetries + 1}):`, error);
        lastError = error;
        // Continue to retry
      }
    }
    
    // If we've exhausted all retries and still have an error
    console.error("All attempts to send WhatsApp message failed");
    return { 
      success: false, 
      error: lastError?.message || "Failed to send WhatsApp message after multiple attempts"
    };
    
  } catch (error) {
    console.error("Unexpected error in sendWhatsAppMessage:", error);
    return { success: false, error: error.message || "Unexpected error sending WhatsApp message" };
  }
}

// Create a Supabase client for database operations
export function createSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
