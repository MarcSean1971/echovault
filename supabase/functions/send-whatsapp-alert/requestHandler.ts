
import { createSuccessResponse, createErrorResponse } from "./utils.ts";
import { sendTemplateMessage, sendStandardMessage } from "./twilioService.ts";

/**
 * Process an incoming WhatsApp alert request
 * @param req Request object
 * @returns Response object
 */
export async function handleWhatsAppAlertRequest(req: Request) {
  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse("Invalid JSON in request body", 400);
    }
    
    // Get request parameters with defaults
    const to = body.recipientPhone || "";
    const templateSid = body.templateId || "HX4386568436c1f993dd47146448194dd8";
    const languageCode = body.languageCode || "en_US";
    const from = body.from || "whatsapp:+14155238886"; // Twilio WhatsApp sender
    
    // Extract template parameters or use defaults
    const param1 = body.senderName || "Sender Name";
    const param2 = body.recipientName || "Recipient Name";
    const param3 = body.locationText || "Location Information";
    const param4 = body.locationLink || "https://maps.example.com";
    
    console.log(`Sending template alert to ${to} using template ${templateSid} with language ${languageCode}`);
    console.log(`Parameters: [${param1}, ${param2}, ${param3}, ${param4}]`);
    
    // Validate required parameters
    if (!to) {
      return createErrorResponse("Missing required 'recipientPhone' parameter", 400);
    }
    
    // Try sending template message first
    const { response, responseData } = await sendTemplateMessage({
      to,
      from,
      templateSid,
      languageCode,
      parameters: {
        "1": param1,
        "2": param2,
        "3": param3,
        "4": param4
      }
    });
    
    // If template failed, try fallback to standard message
    if (!response.ok && responseData?.message?.includes("template")) {
      console.log("Template sending failed. Error:", responseData.message);
      console.log("Attempting fallback to standard message...");
      
      // Prepare fallback message
      const fallbackMessage = `EMERGENCY ALERT: ${param1} has sent you an emergency alert. They are at ${param3}. View on map: ${param4}`;
      
      // Send fallback message
      const { response: fallbackResponse, responseData: fallbackData } = await sendStandardMessage({
        to,
        from,
        message: fallbackMessage
      });
      
      if (fallbackResponse.ok) {
        return createSuccessResponse({
          sid: fallbackData.sid,
          status: fallbackData.status || "sent",
          fallback: true,
          originalError: responseData.message
        });
      }
    }
    
    // Return success or error from the original response
    if (response.ok) {
      return createSuccessResponse({
        sid: responseData.sid,
        status: responseData.state || "sent"
      });
    } else {
      return createErrorResponse({
        error: responseData.message || "Unknown error",
        details: responseData
      }, 500);
    }
    
  } catch (error) {
    console.error("Error in send-whatsapp-alert function:", error);
    return createErrorResponse(error);
  }
}
