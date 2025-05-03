
import { supabaseClient } from "../supabase-client.ts";
import { corsHeaders } from "../cors-headers.ts";

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
    
    // Create Supabase client
    const supabase = supabaseClient();
    
    // Get the message condition to check PIN
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("pin_code")
      .eq("message_id", messageId)
      .single();
      
    if (conditionError || !condition) {
      console.error("Error fetching message condition:", conditionError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Message condition not found" 
      }), { 
        status: 404, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // Verify PIN
    if (condition.pin_code !== pin) {
      console.warn(`Incorrect PIN attempt for message ${messageId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Incorrect PIN" 
      }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }
    
    // PIN is correct, update delivery record
    const { data: deliveryRecord, error: deliveryError } = await supabase
      .from("delivered_messages")
      .update({ 
        viewed_at: new Date().toISOString(),
        viewed_count: 1
      })
      .eq("delivery_id", deliveryId)
      .eq("message_id", messageId)
      .select();
      
    if (deliveryError) {
      console.error("Error updating delivery record:", deliveryError);
      // Continue anyway, PIN verification succeeded
    }
    
    return new Response(JSON.stringify({ 
      success: true 
    }), { 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
    
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
