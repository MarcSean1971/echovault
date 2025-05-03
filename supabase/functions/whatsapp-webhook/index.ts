
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  From: string;  // Format: whatsapp:+1234567890
  Body: string;  // Message content
  SmsStatus?: string;
  MessageSid?: string;
  AccountSid?: string;
  To?: string;    // Format: whatsapp:+1234567890
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("WhatsApp webhook called");
    
    // Parse the incoming message (handle both JSON and form data)
    let messageData: WhatsAppMessage;
    
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      messageData = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      messageData = {
        From: formData.get("From") as string,
        Body: formData.get("Body") as string,
        SmsStatus: formData.get("SmsStatus") as string,
        MessageSid: formData.get("MessageSid") as string,
        AccountSid: formData.get("AccountSid") as string,
        To: formData.get("To") as string,
      };
    } else {
      throw new Error("Unsupported content type");
    }
    
    console.log("Received WhatsApp message:", JSON.stringify(messageData, null, 2));
    
    if (!messageData.From || !messageData.Body) {
      throw new Error("Missing required message fields");
    }
    
    // Extract the phone number from the From field (remove the 'whatsapp:' prefix)
    const fromNumber = messageData.From.replace("whatsapp:", "");
    const messageBody = messageData.Body.trim();
    
    console.log(`Processing message from ${fromNumber}: "${messageBody}"`);

    // Find a user by this phone number
    const supabase = supabaseClient();
    const { data: recipients, error: recipientError } = await supabase
      .from("recipients")
      .select("id, user_id")
      .eq("phone", fromNumber)
      .limit(1);
    
    if (recipientError) {
      console.error("Error looking up recipient:", recipientError);
      throw recipientError;
    }
    
    if (!recipients || recipients.length === 0) {
      console.log("No recipient found with phone number:", fromNumber);
      return new Response(
        JSON.stringify({ status: "error", message: "No recipient found with this phone number" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const recipient = recipients[0];
    console.log(`Found recipient with ID: ${recipient.id}, user ID: ${recipient.user_id}`);
    
    // Look for panic messages with this trigger keyword
    // Updated to only reference panic_config which exists in the database
    const { data: conditions, error: conditionsError } = await supabase
      .from("message_conditions")
      .select("id, message_id, panic_config")
      .eq("condition_type", "panic_trigger")
      .eq("active", true);

    if (conditionsError) {
      console.error("Error finding panic conditions:", conditionsError);
      throw conditionsError;
    }
    
    console.log(`Found ${conditions?.length || 0} active panic trigger conditions`);
    
    let matched = false;
    
    // Check each condition for matching keyword
    for (const condition of conditions || []) {
      // Updated to only use panic_config as the source of configuration
      const config = condition.panic_config;
      
      if (!config || !config.methods || !config.methods.includes('whatsapp')) {
        continue; // Skip if not configured for WhatsApp
      }
      
      const triggerKeyword = (config.trigger_keyword || "SOS").toLowerCase();
      
      if (messageBody.toLowerCase() === triggerKeyword.toLowerCase()) {
        console.log(`Keyword match found: "${messageBody}" matches configured keyword "${triggerKeyword}"`);
        matched = true;
        
        // Trigger the panic message
        try {
          const { data: triggerResult, error: triggerError } = await supabase.functions.invoke("send-message-notifications", {
            body: { 
              messageId: condition.message_id,
              isEmergency: true,
              debug: true
            }
          });
          
          if (triggerError) {
            console.error("Error triggering message:", triggerError);
            throw triggerError;
          }
          
          console.log("Successfully triggered message:", triggerResult);
          
          // Send confirmation back to the user
          const { error: responseError } = await supabase.functions.invoke("send-whatsapp-notification", {
            body: {
              to: fromNumber,
              message: "⚠️ EMERGENCY ALERT TRIGGERED. Your emergency messages are now being sent.",
              isEmergency: true
            }
          });
          
          if (responseError) {
            console.error("Error sending confirmation message:", responseError);
          }
          
          break; // Stop after first match
        } catch (e) {
          console.error("Error in trigger flow:", e);
          throw e;
        }
      }
    }
    
    if (!matched) {
      console.log("No matching trigger keyword found");
      // Optionally send a message back saying no keyword matched
      await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: fromNumber,
          message: "No matching emergency trigger found. Please check the keyword and try again."
        }
      });
    }
    
    // Return success response to Twilio
    return new Response(
      JSON.stringify({ 
        success: true,
        matched: matched,
        message: matched ? "Emergency alert triggered" : "No matching keyword found",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in WhatsApp webhook:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
