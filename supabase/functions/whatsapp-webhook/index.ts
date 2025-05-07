
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  createSuccessResponse, 
  createErrorResponse,
  extractWhatsAppMessageData
} from "../shared/whatsapp-utils.ts";
import { createSupabaseAdmin } from "../shared/supabase-client.ts";

/**
 * Processes incoming WhatsApp webhook requests from Twilio
 * - Handles check-in messages (CHECKIN, CHECK-IN, CODE)
 * - Handles panic trigger messages (SOS or custom keyword)
 * - Uses user phone number to identify the user
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[WEBHOOK] Processing WhatsApp webhook request");
    
    // Extract message data (from number and message content)
    const { fromNumber, messageBody } = await extractWhatsAppMessageData(req);
    
    console.log(`[WEBHOOK] From: ${fromNumber}, Message: ${messageBody}`);
    
    if (!fromNumber || !messageBody) {
      return createErrorResponse({ message: "Missing required data: From and Body" }, 400);
    }
    
    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    
    // Step 1: Find the user by their phone number
    let userId = null;
    
    // Check profiles table
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", fromNumber)
      .limit(1);
      
    if (profiles && profiles.length > 0) {
      userId = profiles[0].id;
      console.log(`[WEBHOOK] Found user via profiles table: ${userId}`);
    } else {
      // Check recipients table as fallback
      const { data: recipients } = await supabase
        .from("recipients")
        .select("user_id")
        .eq("phone", fromNumber)
        .limit(1);
      
      if (recipients && recipients.length > 0) {
        userId = recipients[0].user_id;
        console.log(`[WEBHOOK] Found user via recipients table: ${userId}`);
      }
    }
    
    if (!userId) {
      console.log(`[WEBHOOK] No user found with phone number: ${fromNumber}`);
      
      // Send reply to user
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: fromNumber,
          message: "Sorry, we couldn't identify your account. Please make sure your WhatsApp number is registered in the system."
        }
      });
      
      return createSuccessResponse({
        success: false,
        message: "No user found with this phone number"
      });
    }
    
    // Step 2: Process the message based on its content
    
    // Check if it's a check-in request
    if (messageBody.toUpperCase() === "CHECKIN" || 
        messageBody.toUpperCase() === "CHECK-IN" || 
        messageBody.toUpperCase() === "CODE") {
      
      console.log(`[WEBHOOK] Processing check-in for user: ${userId}`);
      
      // Process the check-in
      const { data: checkInResult } = await supabase.functions.invoke("perform-whatsapp-check-in", {
        body: {
          userId,
          phoneNumber: fromNumber,
          method: "whatsapp"
        }
      });
      
      // Send confirmation to user
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: fromNumber,
          message: "✅ CHECK-IN SUCCESSFUL. Your dead man's switch has been reset."
        }
      });
      
      return createSuccessResponse({
        type: "check-in",
        userId,
        result: checkInResult
      });
    }
    
    // Handle potential panic trigger
    console.log(`[WEBHOOK] Checking if "${messageBody}" is a panic trigger`);
    
    // Get active panic trigger conditions for this user
    const { data: panicConditions } = await supabase
      .from("message_conditions")
      .select("id, message_id, panic_config")
      .eq("condition_type", "panic_trigger")
      .eq("active", true);
    
    console.log(`[WEBHOOK] Found ${panicConditions?.length || 0} active panic conditions`);
    
    // Exit early if no conditions found
    if (!panicConditions || panicConditions.length === 0) {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: fromNumber,
          message: "No active panic messages configured. To trigger an emergency message, set up a panic trigger in the app."
        }
      });
      
      return createSuccessResponse({
        type: "no_panic_conditions",
        userId
      });
    }
    
    // Check if message matches any trigger keywords
    let matchFound = false;
    let matchedMessageId = null;
    
    for (const condition of panicConditions) {
      const config = condition.panic_config || {};
      const triggerKeyword = (config.trigger_keyword || "SOS").toLowerCase();
      
      if (messageBody.toLowerCase() === triggerKeyword) {
        console.log(`[WEBHOOK] Match found! "${messageBody}" matches trigger "${triggerKeyword}"`);
        matchFound = true;
        matchedMessageId = condition.message_id;
        
        // Trigger the emergency message
        const { data: triggerResult } = await supabase.functions.invoke("send-message-notifications", {
          body: {
            messageId: condition.message_id,
            isEmergency: true,
            debug: true
          }
        });
        
        // Send confirmation to user
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: fromNumber,
            message: "⚠️ EMERGENCY ALERT TRIGGERED. Your emergency messages have been sent to all recipients."
          }
        });
        
        break; // Stop after first match
      }
    }
    
    // If no match found, send a helpful message
    if (!matchFound) {
      const defaultTrigger = "SOS";
      
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: fromNumber,
          message: `No matching emergency trigger found. Please send '${defaultTrigger}' to trigger your emergency message.`
        }
      });
      
      return createSuccessResponse({
        type: "no_match",
        userId
      });
    }
    
    return createSuccessResponse({
      type: "panic_trigger",
      userId,
      matched: true,
      messageId: matchedMessageId
    });
    
  } catch (error) {
    return createErrorResponse(error);
  }
});
