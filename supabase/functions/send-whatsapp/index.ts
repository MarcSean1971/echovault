
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendWhatsAppMessage, corsHeaders, createSuccessResponse, createErrorResponse } from "../shared/whatsapp-utils.ts";

/**
 * Sends both regular and template WhatsApp messages through a unified interface
 * 
 * Request body can include:
 * - to: Target phone number
 * - message: Text message content (for non-template messages)
 * - useTemplate: Boolean to indicate template usage
 * - templateId: ID of the template to use
 * - templateParams: Key-value pairs of template parameters
 * - languageCode: Language code for template (default: en_US)
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return createErrorResponse({ message: "Invalid JSON in request body" }, 400);
    }

    // Extract parameters from request
    const { 
      to, 
      message, 
      useTemplate, 
      templateId, 
      templateParams, 
      languageCode = "en_US" 
    } = requestData;

    // Validate the required parameters
    if (!to) {
      return createErrorResponse({ message: "Missing required 'to' parameter" }, 400);
    }

    if (useTemplate && !templateId) {
      return createErrorResponse({ message: "Template ID is required when useTemplate is true" }, 400);
    }

    if (!useTemplate && !message) {
      return createErrorResponse({ message: "Message is required when not using a template" }, 400);
    }

    // Send the message using our utility function
    const result = await sendWhatsAppMessage({
      to,
      message,
      useTemplate,
      templateId,
      templateParams,
      languageCode
    });

    // Return success response
    return createSuccessResponse({
      sid: result.sid,
      status: useTemplate ? result.state : result.status,
      usingTemplate: useTemplate,
      templateId: useTemplate ? templateId : null
    });
  } catch (error) {
    return createErrorResponse(error);
  }
});
