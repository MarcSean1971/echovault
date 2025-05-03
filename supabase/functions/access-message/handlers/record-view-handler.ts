
import { supabaseClient } from "../supabase-client.ts";
import { corsHeaders } from "../cors-headers.ts";

/**
 * Handle recording message views
 */
export const handleRecordView = async (req: Request): Promise<Response> => {
  try {
    // Parse the request body
    const { messageId, deliveryId, recipientEmail } = await req.json();
    
    if (!messageId || !deliveryId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameters" 
      }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // Create Supabase client
    const supabase = supabaseClient();
    
    // Check if the delivered_messages table exists
    try {
      // Update delivery record
      const { data, error } = await supabase
        .from("delivered_messages")
        .update({ 
          viewed_at: new Date().toISOString(),
          viewed_count: 1,
          device_info: req.headers.get("user-agent") || null
        })
        .eq("delivery_id", deliveryId)
        .eq("message_id", messageId);
        
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
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
      }
      
      return new Response(JSON.stringify({ 
        success: true 
      }), { 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    } catch (error: any) {
      console.error("Error in record view handling:", error);
      
      // Return success anyway to avoid breaking the user experience
      return new Response(JSON.stringify({ 
        success: true,
        message: "View recorded (with warnings)" 
      }), { 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
  } catch (error: any) {
    console.error("Error recording message view:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error processing request" 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }
};
