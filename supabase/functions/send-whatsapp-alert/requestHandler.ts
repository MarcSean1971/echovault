
import { corsHeaders } from "./utils.ts";
import { sendWhatsAppMessage } from "../shared/services/whatsapp-service.ts";

// Handle WhatsApp alert requests
export async function handleWhatsAppAlertRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    
    // Extract parameters from request
    const {
      recipientPhone,
      senderName,
      recipientName,
      locationText,
      locationLink,
      messageType = 'emergency',  // Default to emergency, but allow other types like check-in
      templateId,  // Allow custom template override
      templateParams // Allow custom params override
    } = body;
    
    // Validate required parameters
    if (!recipientPhone) {
      return createErrorResponse("Missing required parameter: recipientPhone");
    }
    
    let result;
    
    // Check if this is a check-in reminder template request
    if (messageType === 'check-in') {
      // For check-in reminders, use the check-in template
      const checkInTemplateId = templateId || "HX48beb2c3b84ffbbed290f7f867ac0665";
      
      const params = templateParams || [
        recipientName || "User",  // First name
        body.messageTitle || "your message",  // Message title
        body.timeRemaining || "soon",  // Time until deadline
        body.checkInUrl || "https://app.yourdomain.com" // App URL
      ];
      
      result = await sendWhatsAppMessage({
        to: recipientPhone,
        useTemplate: true,
        templateId: checkInTemplateId,
        templateParams: params,
        languageCode: body.languageCode || "en_US"
      });
    } else {
      // Default to emergency template
      const emergencyTemplateId = templateId || "HXa95959595"; // This should be your actual emergency template ID
      
      const params = templateParams || [
        senderName || "Someone",
        recipientName || "User",
        locationText || "Unknown location",
        locationLink || "No map link available"
      ];
      
      result = await sendWhatsAppMessage({
        to: recipientPhone,
        useTemplate: true,
        templateId: emergencyTemplateId,
        templateParams: params,
        languageCode: body.languageCode || "en_US"
      });
    }
    
    if (result.success) {
      return createSuccessResponse({
        success: true,
        messageId: result.messageId,
        templateType: messageType,
        to: recipientPhone
      });
    } else {
      return createErrorResponse(result.error || "Failed to send WhatsApp message");
    }
    
  } catch (error) {
    console.error("Error in handleWhatsAppAlertRequest:", error);
    return createErrorResponse(error instanceof Error ? error.message : String(error));
  }
}

// Helper function to create a standardized error response
function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status: status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

// Helper function to create a standardized success response
function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}
