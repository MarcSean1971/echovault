
/**
 * CORS headers for cross-origin requests
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-host, origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Create a successful response with CORS headers and consistent formatting
 */
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
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

/**
 * Create an error response with CORS headers and consistent formatting
 */
export function createErrorResponse(error: any, status: number = 500) {
  const errorMessage = error instanceof Error ? error.message : 
                      (typeof error === 'string' ? error : 
                      (error.message || "Unknown error"));
  
  console.error("[ERROR]", errorMessage);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? undefined : error,
      timestamp: new Date().toISOString()
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

/**
 * Extract WhatsApp message data from webhook request
 * Support both direct JSON payload and form data from Twilio
 */
export async function extractWhatsAppMessageData(req: Request) {
  try {
    // Try to parse as JSON first (for API requests)
    try {
      const jsonData = await req.clone().json();
      
      if (jsonData.Body && jsonData.From) {
        return {
          fromNumber: jsonData.From.replace('whatsapp:', ''),
          messageBody: jsonData.Body
        };
      }
    } catch (e) {
      // Not JSON, might be form data
    }
    
    // Try to parse as form data (from Twilio webhook)
    const formData = await req.formData();
    
    const fromNumber = formData.get('From')?.toString().replace('whatsapp:', '') || '';
    const messageBody = formData.get('Body')?.toString() || '';
    
    return { fromNumber, messageBody };
  } catch (error) {
    console.error("Error extracting WhatsApp message data:", error);
    return { fromNumber: '', messageBody: '' };
  }
}
