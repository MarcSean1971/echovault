
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesToNotify } from "./db-service.ts";
import { sendMessageNotification } from "./notification-service.ts";
import { MessageNotificationRequest } from "./types.ts";
import { supabaseClient } from "./supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate the request body
    let requestData: MessageNotificationRequest;
    
    try {
      // Try to parse the request body as JSON
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      // Default to empty object if JSON parsing fails
      requestData = {};
    }
    
    const { messageId, isEmergency = false, debug = false, keepArmed = undefined } = requestData;
    
    console.log(`===== SEND MESSAGE NOTIFICATIONS =====`);
    console.log(`Starting notification process at ${new Date().toISOString()}`);
    console.log(`DEBUG MODE: ${debug ? 'Enabled' : 'Disabled'}`);
    console.log(`Processing message notifications${messageId ? ` for message ID: ${messageId}` : ''}`);
    console.log(`Is emergency notification: ${isEmergency ? 'YES' : 'No'}`);
    if (keepArmed !== undefined) {
      console.log(`Keep armed flag explicitly set to: ${keepArmed}`);
    }
    
    // Get messages that need notification
    const messagesToNotify = await getMessagesToNotify(messageId);
    console.log(`Found ${messagesToNotify.length} messages to notify`);
    
    if (messagesToNotify.length === 0) {
      console.log("No messages found to notify! Check the active status and other parameters.");
      if (messageId) {
        console.log(`Requested message ID ${messageId} not found or not eligible for notification`);
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No messages found to notify",
          requestedMessageId: messageId || null,
          timestamp: new Date().toISOString()
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Enhance conditions with the explicit keepArmed flag if provided
    if (keepArmed !== undefined && messagesToNotify.length > 0) {
      messagesToNotify.forEach(message => {
        if (message.condition.condition_type === 'panic_trigger' && 
            message.condition.panic_config) {
          // Update the panic_config with the explicit keepArmed value
          message.condition.panic_config.keep_armed = keepArmed;
          console.log(`Updated panic_config.keep_armed to ${keepArmed} for message ${message.message.id}`);
        }
      });
    }

    // Send notifications for each message
    const results = await Promise.all(
      messagesToNotify.map(message => 
        sendMessageNotification(message, {
          isEmergency,
          debug: debug || isEmergency // Always enable debug mode for emergency messages
        })
      )
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Log detailed results
    console.log(`===== NOTIFICATION RESULTS =====`);
    console.log(`Success: ${successful}, Failed: ${failed}`);
    console.log("Detailed results:", JSON.stringify(results, null, 2));
    console.log(`===== END NOTIFICATION PROCESS =====`);

    return new Response(
      JSON.stringify({ 
        success: successful > 0, 
        messages_processed: messagesToNotify.length,
        successful_notifications: successful,
        failed_notifications: failed,
        results: results,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-message-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        stack: error.stack || "No stack trace available",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
