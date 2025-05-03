
import { corsHeaders } from "../cors-headers.ts";
import { verifyPinAndRecordView } from "../delivery-service.ts";

/**
 * Handle PIN verification for protected messages
 */
export const handleVerifyPin = async (req: Request): Promise<Response> => {
  // Set explicit JSON content type for all responses with CORS headers
  const jsonHeaders = { 
    "Content-Type": "application/json", 
    ...corsHeaders 
  };
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: jsonHeaders });
  }
  
  try {
    // Parse the request body
    const { pin, messageId, deliveryId, recipientEmail } = await req.json();
    
    if (!pin || !messageId || !deliveryId || !recipientEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), { 
        status: 400, 
        headers: jsonHeaders 
      });
    }
    
    console.log(`Processing PIN verification request for message ${messageId}, delivery ${deliveryId}`);
    
    try {
      const result = await verifyPinAndRecordView(messageId, deliveryId, pin);
      
      console.log(`PIN verification successful for message ${messageId}`);
      
      return new Response(JSON.stringify({ 
        success: true 
      }), { 
        headers: jsonHeaders 
      });
    } catch (verifyError: any) {
      console.warn(`PIN verification error: ${verifyError.message}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: verifyError.message 
      }), { 
        status: verifyError.message.includes("not found") ? 404 : 401,
        headers: jsonHeaders 
      });
    }
    
  } catch (error: any) {
    console.error("Error verifying PIN:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error processing request" 
    }), { 
      status: 500, 
      headers: jsonHeaders
    });
  }
};
