
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesToNotify } from "./db/index.ts";
import { sendMessageNotification } from "./notification-service.ts";
import { MessageNotificationRequest } from "./types.ts";
import { supabaseClient } from "./supabase-client.ts";
import { getSystemHealthStatus } from "./db/system-health.ts";

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
    // Get URL to check if this is a status request
    const url = new URL(req.url);
    if (url.pathname.endsWith('/status')) {
      console.log("Health check request received");
      const status = await getSystemHealthStatus();
      return new Response(
        JSON.stringify(status),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Validate the request body
    let requestData: MessageNotificationRequest;
    
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      requestData = {};
    }
    
    const { 
      messageId, 
      isEmergency = false, 
      debug = false, 
      forceSend = false, 
      source = 'api'
    } = requestData;
    
    console.log(`===== FINAL MESSAGE DELIVERY TO RECIPIENTS =====`);
    console.log(`Starting final delivery process at ${new Date().toISOString()}`);
    console.log(`DEBUG MODE: ${debug ? 'Enabled' : 'Disabled'}`);
    console.log(`Processing final message delivery${messageId ? ` for message ID: ${messageId}` : ''}`);
    console.log(`Is emergency notification: ${isEmergency ? 'YES' : 'No'}`);
    console.log(`Force send: ${forceSend ? 'YES' : 'No'}`);
    console.log(`Source: ${source}`);
    
    // Get messages that have reached their deadline
    console.log(`[FINAL-DELIVERY] Fetching messages that have reached their deadline`);
    const messagesToNotify = await getMessagesToNotify(messageId, true); // Always use forceSend for final delivery
    console.log(`[FINAL-DELIVERY] Found ${messagesToNotify.length} messages ready for final delivery`);
    
    if (messagesToNotify.length === 0) {
      console.log("[FINAL-DELIVERY] No messages found ready for final delivery");
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No messages found ready for final delivery",
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

    // Send final messages to recipients
    console.log(`[FINAL-DELIVERY] Processing ${messagesToNotify.length} messages for final delivery`);
    const results = await Promise.all(
      messagesToNotify.map(message => 
        sendMessageNotification(message, {
          isEmergency,
          debug: debug || isEmergency,
          forceSend: true, // Always force send for final delivery
          bypassDeduplication: true, // Always bypass deduplication for final delivery
          source: source,
          skipRecipientNotifications: false // NEVER skip recipients for final delivery
        })
      )
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Log detailed results
    console.log(`===== FINAL DELIVERY RESULTS =====`);
    console.log(`Success: ${successful}, Failed: ${failed}`);
    console.log("Detailed results:", JSON.stringify(results, null, 2));
    console.log(`===== END FINAL DELIVERY PROCESS =====`);

    return new Response(
      JSON.stringify({ 
        success: successful > 0, 
        messages_processed: messagesToNotify.length,
        successful_notifications: successful,
        failed_notifications: failed,
        results: results,
        timestamp: new Date().toISOString(),
        finalDelivery: true
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
