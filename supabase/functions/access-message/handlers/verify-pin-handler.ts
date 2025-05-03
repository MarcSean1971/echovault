
import { corsHeaders } from "../cors-headers.ts";
import { verifyPinAndRecordView } from "../delivery-service.ts";

/**
 * Handle PIN verification for protected messages
 */
export const handleVerifyPin = async (req: Request): Promise<Response> => {
  try {
    // Parse the request body
    const { pin, messageId, deliveryId, recipientEmail } = await req.json();
    
    if (!pin || !messageId || !deliveryId || !recipientEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    try {
      const result = await verifyPinAndRecordView(messageId, deliveryId, pin);
      
      return new Response(JSON.stringify({ 
        success: true 
      }), { 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    } catch (verifyError: any) {
      console.warn(`PIN verification error: ${verifyError.message}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: verifyError.message 
      }), { 
        status: verifyError.message.includes("not found") ? 404 : 401,
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
  } catch (error: any) {
    console.error("Error verifying PIN:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error processing request" 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }
};
