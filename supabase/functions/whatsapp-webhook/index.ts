
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../shared/utils/cors-headers.ts";
import { createSuccessResponse, createErrorResponse } from "../shared/utils/response-formatters.ts";
import { extractWhatsAppMessageData } from "../shared/utils/message-extractor.ts";
import { processWhatsAppMessage } from "./handlers/message-handler.ts";

/**
 * Processes incoming WhatsApp webhook requests from Twilio
 * - Handles check-in messages (CHECKIN, CHECK-IN, CODE)
 * - Handles panic trigger messages (SOS or custom keyword)
 * - Uses user phone number to identify the user
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[WEBHOOK] Processing WhatsApp webhook request");
    
    // Extract message data (from number and message content)
    const { fromNumber, messageBody } = await extractWhatsAppMessageData(req);
    
    console.log(`[WEBHOOK] From: ${fromNumber}, Message: ${messageBody}`);
    
    if (!fromNumber || !messageBody) {
      return createErrorResponse({ message: "Missing required data: From and Body" }, 400);
    }
    
    // Process the message and get response
    const result = await processWhatsAppMessage(fromNumber, messageBody);
    
    return createSuccessResponse(result);
    
  } catch (error) {
    return createErrorResponse(error);
  }
});
