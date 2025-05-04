
import { WhatsAppMessageRequest } from "../models/whatsapp.ts";
import { buildMessageFormData } from "../services/messageBuilder.ts";
import { sendTwilioMessage, createSuccessResponse } from "../services/twilioService.ts";
import { corsHeaders } from "../utils/cors.ts";
import { getTwilioCredentials } from "../utils/env.ts";

/**
 * Parse request body and extract WhatsApp message data
 * @param req The HTTP request
 * @returns Parsed WhatsApp message request data
 */
async function parseRequestBody(req: Request): Promise<WhatsAppMessageRequest> {
  // Always handle the body as JSON first
  const contentType = req.headers.get("content-type") || "";
  console.log(`Received request with content-type: ${contentType}`);
  
  // Ensure we properly handle the incoming request
  const bodyText = await req.text();
  console.log(`Request body raw text: ${bodyText}`);
  
  try {
    // Try to parse as JSON
    const requestData = JSON.parse(bodyText);
    console.log("Successfully parsed request as JSON");
    return requestData;
  } catch (jsonError) {
    // If not valid JSON, try to handle as URL-encoded form data
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = new URLSearchParams(bodyText);
      const requestData = {
        to: formData.get("to") || "",
        message: formData.get("message") || "",
        messageId: formData.get("messageId") || undefined,
        recipientName: formData.get("recipientName") || undefined,
        isEmergency: formData.get("isEmergency") === "true",
        // Add template-related fields
        useTemplate: formData.get("useTemplate") === "true",
        templateId: formData.get("templateId") || undefined,
        templateParams: formData.getAll("templateParams") || [],
      };
      console.log("Successfully parsed request as form data");
      return requestData;
    } else {
      // Neither valid JSON nor valid form data
      throw new Error(`Invalid request body format: ${jsonError.message}`);
    }
  }
}

/**
 * Validate WhatsApp message request data
 * @param requestData The WhatsApp message request data
 * @throws Error if validation fails
 */
function validateRequestData(requestData: WhatsAppMessageRequest): void {
  const { to, message, useTemplate, templateId } = requestData;
  
  if (!to) {
    throw new Error("Missing required parameter: 'to' phone number is required.");
  }
  
  if (!useTemplate && !message) {
    throw new Error("Either 'message' or template information is required.");
  }
  
  if (useTemplate && !templateId) {
    throw new Error("Template ID is required when using templates.");
  }
}

/**
 * Main request handler for WhatsApp notifications
 * @param req The HTTP request
 * @returns HTTP response
 */
export async function handleRequest(req: Request) {
  // Verify Twilio credentials are available
  getTwilioCredentials();
  
  // Parse the request body
  const requestData = await parseRequestBody(req);
  console.log("Parsed WhatsApp notification request:", JSON.stringify(requestData, null, 2));
  
  // Validate the request data
  validateRequestData(requestData);
  
  const { useTemplate, templateId, isEmergency } = requestData;
  
  console.log(`Sending WhatsApp message to: ${requestData.to}`);
  console.log(`Is emergency: ${isEmergency ? "Yes" : "No"}`);
  console.log(`Using template: ${useTemplate ? "Yes" : "No"}`);
  
  if (useTemplate) {
    console.log(`Template ID: ${templateId}`);
    console.log(`Template params: ${JSON.stringify(requestData.templateParams)}`);
  }
  
  // Build message form data
  const formData = buildMessageFormData(requestData);
  
  // Send the message
  const responseData = await sendTwilioMessage(formData);
  
  // Return success response
  return createSuccessResponse(responseData, Boolean(useTemplate), templateId);
}
