import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient, publicWebhookClient } from "./supabase-client.ts";
import { corsHeaders } from "./cors-headers.ts";

// Core function to process an SOS message - simplified for reliability
async function processPanicTrigger(fromNumber: string, messageBody: string) {
  try {
    console.log(`[EMERGENCY] Processing potential panic trigger from ${fromNumber}: "${messageBody}"`);
    
    // Initialize Supabase client
    const supabase = supabaseClient();
    
    // 1. STEP ONE: Look for the user with this phone number (check both profiles and recipients tables)
    let userId = null;
    
    // First check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", fromNumber)
      .limit(1);
      
    if (profilesError) {
      console.error("[EMERGENCY] Error looking up profile by WhatsApp number:", profilesError);
    }
    
    if (profiles && profiles.length > 0) {
      userId = profiles[0].id;
      console.log(`[EMERGENCY] Found user via profiles table: ${userId}`);
    } else {
      // As a fallback, check recipients table
      console.log("[EMERGENCY] No profile found, checking recipients table...");
      
      const { data: recipients, error: recipientError } = await supabase
        .from("recipients")
        .select("user_id")
        .eq("phone", fromNumber)
        .limit(1);
      
      if (recipientError) {
        console.error("[EMERGENCY] Error looking up recipient:", recipientError);
      }
      
      if (recipients && recipients.length > 0) {
        userId = recipients[0].user_id;
        console.log(`[EMERGENCY] Found user via recipients table: ${userId}`);
      }
    }
    
    if (!userId) {
      console.log(`[EMERGENCY] No user found with WhatsApp number: ${fromNumber}`);
      return {
        success: false,
        error: "No user found with this WhatsApp number"
      };
    }
    
    // 2. STEP TWO: Find active panic message conditions for this user
    console.log(`[EMERGENCY] Looking for panic trigger conditions for user ${userId}`);
    
    const { data: panicConditions, error: conditionsError } = await supabase
      .from("message_conditions")
      .select("id, message_id, panic_config, panic_trigger_config")
      .eq("condition_type", "panic_trigger")
      .eq("active", true);
    
    if (conditionsError) {
      console.error("[EMERGENCY] Error finding panic conditions:", conditionsError);
      throw conditionsError;
    }
    
    console.log(`[EMERGENCY] Found ${panicConditions?.length || 0} active panic trigger conditions`);
    
    // Exit early if no conditions found
    if (!panicConditions || panicConditions.length === 0) {
      console.log("[EMERGENCY] No active panic conditions found for this user");
      return {
        success: false,
        error: "No active panic messages configured"
      };
    }
    
    // 3. STEP THREE: Check if message matches any trigger keywords
    // Simplify the message matching - just check if the content matches any configured trigger word
    // or default to "SOS" if none configured
    let matchFound = false;
    let matchedMessageId = null;
    
    for (const condition of panicConditions) {
      // Get the configuration (could be in panic_config or panic_trigger_config)
      const config = condition.panic_config || condition.panic_trigger_config || {};
      
      // Get trigger keyword, default to "SOS"
      let triggerKeyword = "SOS";
      
      if (config && typeof config === 'object') {
        triggerKeyword = config.trigger_keyword || "SOS";
      }
      
      console.log(`[EMERGENCY] Checking if "${messageBody}" matches trigger word "${triggerKeyword}"`);
      
      // Simple direct case-insensitive match
      if (messageBody.toLowerCase() === triggerKeyword.toLowerCase()) {
        console.log(`[EMERGENCY] MATCH FOUND! "${messageBody}" matches "${triggerKeyword}"`);
        matchFound = true;
        matchedMessageId = condition.message_id;
        
        // 4. STEP FOUR: Trigger the emergency message
        try {
          console.log(`[EMERGENCY] Triggering emergency notification for message ID: ${condition.message_id}`);
          
          const { data: triggerResult, error: triggerError } = await supabase.functions.invoke("send-message-notifications", {
            body: {
              messageId: condition.message_id,
              isEmergency: true,
              debug: true
            }
          });
          
          if (triggerError) {
            console.error("[EMERGENCY] Error triggering notification:", triggerError);
            throw triggerError;
          }
          
          console.log("[EMERGENCY] Successfully triggered emergency notification:", triggerResult);
          
          // 5. STEP FIVE: Send confirmation to user
          try {
            await supabase.functions.invoke("send-whatsapp-notification", {
              body: {
                to: fromNumber,
                message: "⚠️ EMERGENCY ALERT TRIGGERED. Your emergency messages have been sent to all recipients.",
                isEmergency: true
              }
            });
            console.log("[EMERGENCY] Sent confirmation back to user");
          } catch (confirmError) {
            console.error("[EMERGENCY] Failed to send confirmation:", confirmError);
          }
          
          break; // Stop after first match
        } catch (triggerError) {
          console.error("[EMERGENCY] Failed to trigger emergency:", triggerError);
          throw triggerError;
        }
      }
    }
    
    // If no match found, send a helpful message
    if (!matchFound) {
      console.log("[EMERGENCY] No matching trigger keyword found");
      
      try {
        await supabase.functions.invoke("send-whatsapp-notification", {
          body: {
            to: fromNumber,
            message: "No matching emergency trigger found. Please send 'SOS' to trigger your emergency message."
          }
        });
        console.log("[EMERGENCY] Sent help message to user");
      } catch (helpError) {
        console.error("[EMERGENCY] Failed to send help message:", helpError);
      }
    }
    
    return {
      success: true,
      matched: matchFound,
      messageId: matchedMessageId
    };
  } catch (error) {
    console.error("[EMERGENCY] Major error processing panic trigger:", error);
    return {
      success: false,
      error: `Error processing emergency trigger: ${error.message || "Unknown error"}`
    };
  }
}

// Core function to handle check-in requests
async function processCheckIn(fromNumber: string) {
  try {
    console.log(`[CHECK-IN] Processing check-in request from ${fromNumber}`);
    
    // Initialize Supabase client
    const supabase = supabaseClient();
    
    // Find the user by phone number
    let userId = null;
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", fromNumber)
      .limit(1);
      
    if (profilesError) {
      console.error("[CHECK-IN] Error looking up profile:", profilesError);
    }
    
    if (profiles && profiles.length > 0) {
      userId = profiles[0].id;
      console.log(`[CHECK-IN] Found user via profile: ${userId}`);
    } else {
      // Check recipients table as fallback
      const { data: recipients, error: recipientError } = await supabase
        .from("recipients")
        .select("user_id")
        .eq("phone", fromNumber)
        .limit(1);
      
      if (recipientError) {
        console.error("[CHECK-IN] Error looking up recipient:", recipientError);
      }
      
      if (recipients && recipients.length > 0) {
        userId = recipients[0].user_id;
        console.log(`[CHECK-IN] Found user via recipients: ${userId}`);
      }
    }
    
    if (!userId) {
      console.log(`[CHECK-IN] No user found with phone number ${fromNumber}`);
      return {
        success: false, 
        error: "No user found with this phone number"
      };
    }
    
    // Perform the check-in
    const { data: checkInResult, error: checkInError } = await supabase.functions.invoke("perform-whatsapp-check-in", {
      body: {
        userId: userId,
        phoneNumber: fromNumber,
        method: "whatsapp"
      }
    });
    
    if (checkInError) {
      console.error("[CHECK-IN] Error performing check-in:", checkInError);
      throw checkInError;
    }
    
    console.log("[CHECK-IN] Check-in successful:", checkInResult);
    
    // Send confirmation
    try {
      await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: fromNumber,
          message: "✅ CHECK-IN SUCCESSFUL. Your Dead Man's Switch has been reset."
        }
      });
      console.log("[CHECK-IN] Sent confirmation message");
    } catch (confirmError) {
      console.error("[CHECK-IN] Error sending confirmation:", confirmError);
    }
    
    return {
      success: true,
      type: "check-in",
      userId: userId
    };
  } catch (error) {
    console.error("[CHECK-IN] Error processing check-in:", error);
    
    try {
      // Send error notification to user
      const supabase = supabaseClient();
      await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: fromNumber,
          message: "❌ CHECK-IN FAILED. Please try again or log in to the app."
        }
      });
    } catch (notifyError) {
      console.error("[CHECK-IN] Failed to send error notification:", notifyError);
    }
    
    return {
      success: false,
      error: `Check-in error: ${error.message || "Unknown error"}`
    };
  }
}

// Main webhook handler
serve(async (req) => {
  console.log(`[WEBHOOK] WhatsApp webhook received ${req.method} request`);
  console.log("[WEBHOOK] Request headers:", Object.fromEntries(req.headers.entries()));
  
  // CORS handling
  if (req.method === 'OPTIONS') {
    console.log("[WEBHOOK] Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Debug all request information
    console.log("[WEBHOOK] Request headers:", 
      Object.fromEntries(req.headers.entries()));
    
    // Parse the incoming message - handle multiple formats
    let fromNumber = "";
    let messageBody = "";
    
    // Get content type
    const contentType = req.headers.get("content-type") || "";
    console.log(`[WEBHOOK] Content-Type: ${contentType}`);
    
    // Parse based on content type
    if (contentType.includes("application/json")) {
      console.log("[WEBHOOK] Parsing JSON body");
      const jsonData = await req.json();
      console.log("[WEBHOOK] JSON data:", jsonData);
      
      // Try to extract data from JSON
      fromNumber = jsonData.From || jsonData.from || "";
      messageBody = jsonData.Body || jsonData.body || "";
      
    } else if (contentType.includes("application/x-www-form-urlencoded") || 
               contentType.includes("multipart/form-data")) {
      console.log("[WEBHOOK] Parsing form data");
      try {
        const formData = await req.formData();
        console.log("[WEBHOOK] Form fields:", 
          [...formData.entries()].map(([k, v]) => `${k}: ${v}`).join(", "));
          
        fromNumber = formData.get("From") || "";
        messageBody = formData.get("Body") || "";
        
      } catch (formError) {
        console.error("[WEBHOOK] Error parsing form data:", formError);
        // Try to get raw text as fallback
        const rawBody = await req.text();
        console.log("[WEBHOOK] Raw request body:", rawBody);
        
        // Try to parse as URL parameters
        try {
          const params = new URLSearchParams(rawBody);
          fromNumber = params.get("From") || "";
          messageBody = params.get("Body") || "";
          console.log(`[WEBHOOK] Extracted from URL params: From=${fromNumber}, Body=${messageBody}`);
        } catch (e) {
          console.error("[WEBHOOK] Failed to parse URL params:", e);
        }
      }
    } else {
      // Last resort: try to parse as text
      console.log("[WEBHOOK] Parsing as plain text");
      try {
        const rawText = await req.text();
        console.log("[WEBHOOK] Raw text:", rawText);
        
        // Try to extract key-value pairs or parse as JSON
        try {
          const maybeJson = JSON.parse(rawText);
          fromNumber = maybeJson.From || maybeJson.from || "";
          messageBody = maybeJson.Body || maybeJson.body || "";
        } catch {
          // If not JSON, try URL params
          const params = new URLSearchParams(rawText);
          fromNumber = params.get("From") || "";
          messageBody = params.get("Body") || "";
        }
        
      } catch (textError) {
        console.error("[WEBHOOK] Error parsing text:", textError);
      }
    }
    
    // Clean up phone number
    fromNumber = fromNumber.replace("whatsapp:", "");
    
    console.log(`[WEBHOOK] Extracted from: "${fromNumber}", body: "${messageBody}"`);
    
    if (!fromNumber || !messageBody) {
      console.error("[WEBHOOK] Missing required data - from or body");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required data: From and Body are required",
          timestamp: new Date().toISOString()
        }),
        {
          status: 200, // Return 200 even for errors to prevent Twilio retries
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    // SIMPLE COMMAND PROCESSING:
    
    // 1. Check for CHECK-IN requests
    if (messageBody.toUpperCase() === "CHECKIN" || 
        messageBody.toUpperCase() === "CHECK-IN" || 
        messageBody.toUpperCase() === "CODE") {
      console.log("[WEBHOOK] Identified check-in request");
      const result = await processCheckIn(fromNumber);
      return new Response(
        JSON.stringify({
          ...result,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200, // Always return 200 so Twilio doesn't retry
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    // 2. Check for SOS/emergency trigger
    console.log("[WEBHOOK] Checking for emergency triggers");
    const result = await processPanicTrigger(fromNumber, messageBody);
    
    return new Response(
      JSON.stringify({
        ...result,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200, // Always return 200 so Twilio doesn't retry
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
    
  } catch (error) {
    // Log error but still return 200 to Twilio
    console.error("[WEBHOOK] Unhandled error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Webhook error: ${error.message || "Unknown error"}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200, // Return 200 even for errors so Twilio doesn't retry
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
