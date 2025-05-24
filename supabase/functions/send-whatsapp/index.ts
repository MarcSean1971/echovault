
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../shared/utils/cors-headers.ts";
import { createSuccessResponse, createErrorResponse } from "../shared/utils/response-formatters.ts";
import { sendWhatsAppMessage } from "../shared/services/whatsapp-service.ts";

/**
 * Simple edge function to send WhatsApp messages
 * This is used by the whatsapp-webhook to send responses
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse("Invalid JSON in request body", 400);
    }
    
    // Extract request parameters
    const { to, message, useTemplate, templateId, templateParams, languageCode } = body;
    
    // Validate required parameters
    if (!to) {
      return createErrorResponse("Missing required parameter: 'to'", 400);
    }
    
    if (!message && !useTemplate) {
      return createErrorResponse("Either 'message' or 'useTemplate' with 'templateId' is required", 400);
    }
    
    if (useTemplate && !templateId) {
      return createErrorResponse("Template ID is required when using templates", 400);
    }
    
    console.log(`[SEND-WHATSAPP] Sending WhatsApp message to ${to}${useTemplate ? ` using template ${templateId}` : ''}`);
    
    // Send the WhatsApp message using our shared function
    const result = await sendWhatsAppMessage({
      to,
      message,
      useTemplate,
      templateId,
      templateParams,
      languageCode
    });
    
    if (!result.success) {
      console.error(`[SEND-WHATSAPP] Failed to send message: ${result.error}`);
      return createErrorResponse(result.error || "Failed to send WhatsApp message", 500);
    }
    
    console.log(`[SEND-WHATSAPP] Message sent successfully, ID: ${result.messageId}`);
    
    return createSuccessResponse({
      messageId: result.messageId,
      status: result.status,
      to: to,
      usingTemplate: result.usingTemplate,
      templateId: result.templateId
    });
  } catch (error) {
    console.error(`[SEND-WHATSAPP] Exception:`, error);
    return createErrorResponse(error);
  }
});
