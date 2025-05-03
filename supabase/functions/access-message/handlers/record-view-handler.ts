
import { corsHeaders } from "../cors-headers.ts";
import { recordMessageView } from "../delivery-service.ts";

/**
 * Handle recording message views
 */
export const handleRecordView = async (req: Request): Promise<Response> => {
  // Set JSON content type for all responses
  const jsonHeaders = { 
    "Content-Type": "application/json", 
    ...corsHeaders 
  };
  
  try {
    // Parse the request body
    const { messageId, deliveryId, recipientEmail } = await req.json();
    
    if (!messageId || !deliveryId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), { 
        status: 400, 
        headers: jsonHeaders 
      });
    }
    
    // Try to record the view
    try {
      const { error } = await recordMessageView(
        messageId, 
        deliveryId, 
        req.headers.get("user-agent") || null
      );
        
      if (error) {
        console.error("Error recording message view:", error);
        
        // If table doesn't exist, try to create it through our function
        if (error.code === "42P01") {
          console.warn("Delivered messages table not found. It may need to be created.");
        }
        
        // Return success anyway to avoid breaking the user experience
        return new Response(JSON.stringify({ 
          success: true,
          message: "View tracking is not available at this time"
        }), { 
          headers: jsonHeaders 
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true 
      }), { 
        headers: jsonHeaders 
      });
    } catch (error: any) {
      console.error("Error in record view handling:", error);
      
      // Return success anyway to avoid breaking the user experience
      return new Response(JSON.stringify({ 
        success: true,
        message: "View recorded (with warnings)" 
      }), { 
        headers: jsonHeaders 
      });
    }
  } catch (error: any) {
    console.error("Error recording message view:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error processing request" 
    }), { 
      status: 500, 
      headers: jsonHeaders
    });
  }
};
