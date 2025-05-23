
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesToNotify } from "./db/index.ts";
import { sendMessageNotification } from "./notification-service.ts";
import { MessageNotificationRequest } from "./types.ts";
import { supabaseClient } from "./supabase-client.ts";
import { getSystemHealthStatus } from "./db/system-health.ts";
import { sendCreatorTestNotification } from "./test-notification-service.ts"; // New import for test mode

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
      // Try to parse the request body as JSON
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      // Default to empty object if JSON parsing fails
      requestData = {};
    }
    
    const { 
      messageId, 
      isEmergency = false, 
      debug = false, 
      keepArmed = undefined, 
      forceSend = false, 
      source = 'api',
      testMode = false, // New parameter for test mode
      bypassDeduplication = false // NEW: Parameter to explicitly bypass deduplication
    } = requestData;
    
    console.log(`===== SEND MESSAGE NOTIFICATIONS =====`);
    console.log(`Starting notification process at ${new Date().toISOString()}`);
    console.log(`DEBUG MODE: ${debug ? 'Enabled' : 'Disabled'}`);
    console.log(`Processing message notifications${messageId ? ` for message ID: ${messageId}` : ''}`);
    console.log(`Is emergency notification: ${isEmergency ? 'YES' : 'No'}`);
    console.log(`Force send: ${forceSend ? 'YES' : 'No'}`);
    console.log(`Bypass deduplication: ${bypassDeduplication ? 'YES' : 'No'}`); // NEW: Log bypass setting
    console.log(`Test mode: ${testMode ? 'YES' : 'No'}`);
    console.log(`Source: ${source}`);
    
    // Check if this is from WhatsApp selection
    const isFromWhatsApp = source && (
      source === 'whatsapp_trigger_single' || 
      source === 'whatsapp_selection_single' || 
      source === 'whatsapp_selection_all' ||
      source === 'whatsapp_selection_fallback'
    );
    
    if (isFromWhatsApp) {
      console.log(`SPECIAL HANDLING: This is a WhatsApp-triggered notification from ${source}`);
    }
    
    // New: Handle test mode specially
    if (testMode && messageId) {
      console.log(`Test mode enabled for message ${messageId} - sending test notification to creator only`);
      const testResult = await sendCreatorTestNotification(messageId, debug);
      
      return new Response(
        JSON.stringify({
          success: testResult.success,
          messages_processed: 1,
          successful_notifications: testResult.success ? 1 : 0,
          failed_notifications: testResult.success ? 0 : 1,
          results: [testResult],
          timestamp: new Date().toISOString(),
          testMode: true
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json", 
            ...corsHeaders,
          },
        }
      );
    }
    
    // Enhanced logging for trigger sources
    if (source && source.includes('trigger')) {
      console.log(`TRIGGER SOURCE DETECTED: ${source}`);
      console.log(`This notification was triggered by database trigger`);
      
      // Log additional info about the trigger
      if (source === 'reminder_schedule_trigger') {
        console.log(`Triggered by reminder_schedule status change to 'sent'`);
      }
    }
    
    if (keepArmed !== undefined) {
      console.log(`Keep armed flag explicitly set to: ${keepArmed}`);
    }
    
    // Get messages that need notification
    const messagesToNotify = await getMessagesToNotify(messageId, forceSend || isFromWhatsApp); // FIXED: Force send for WhatsApp triggers
    console.log(`Found ${messagesToNotify.length} messages to notify out of ${messageId ? '1 requested' : 'all active conditions'}`);
    
    if (messagesToNotify.length === 0 && messageId) {
      // If we have a specific messageId but couldn't find it for notification,
      // let's check if it exists and log additional details
      const supabase = supabaseClient();
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('id, title')
        .eq('id', messageId)
        .single();
        
      const { data: conditionData, error: conditionError } = await supabase
        .from('message_conditions')
        .select('id, condition_type, active')
        .eq('message_id', messageId)
        .single();
      
      if (messageData) {
        console.log(`Requested message ${messageId} exists with title: "${messageData.title}"`);
        
        if (conditionData) {
          console.log(`Message has condition type: ${conditionData.condition_type}, active: ${conditionData.active}`);
          
          // Log additional debugging information about why the message didn't qualify
          if (!conditionData.active) {
            console.log("Message condition is not active, that's why it wasn't included");
            
            // If forceSend is true or this is from WhatsApp, we'll include it anyway
            if (forceSend || isFromWhatsApp) {
              console.log("Force send or WhatsApp trigger is enabled, trying to process this message anyway");
              
              // Get the full message and condition data
              const { data: fullMessageData } = await supabase
                .from('messages')
                .select('*')
                .eq('id', messageId)
                .single();
                
              const { data: fullConditionData } = await supabase
                .from('message_conditions')
                .select('*')
                .eq('message_id', messageId)
                .single();
                
              if (fullMessageData && fullConditionData) {
                // Create a synthetic message notification object
                const forcedMessage = {
                  message: fullMessageData,
                  condition: fullConditionData
                };
                
                console.log("Forcing notification for:", forcedMessage);
                
                // Send notification
                await sendMessageNotification(forcedMessage, {
                  isEmergency,
                  debug: true, // Always enable debug mode for forced messages
                  forceSend: true,
                  bypassDeduplication: isFromWhatsApp || bypassDeduplication // FIXED: Bypass deduplication for WhatsApp
                });
                
                return new Response(
                  JSON.stringify({ 
                    success: true, 
                    message: "Forced message notification processed",
                    messageId: messageId,
                    timestamp: new Date().toISOString(),
                    source: source || "forced"
                  }),
                  {
                    status: 200,
                    headers: {
                      "Content-Type": "application/json",
                      ...corsHeaders,
                    },
                  }
                );
              }
            }
          }
        } else {
          console.log(`Message exists but has no conditions: ${conditionError?.message || 'No condition found'}`);
        }
      } else {
        console.log(`Requested message ID ${messageId} not found: ${messageError?.message || 'Message not found'}`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No messages found to notify",
          requestedMessageId: messageId || null,
          source: source,
          forceSend: forceSend,
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
    
    if (messagesToNotify.length === 0) {
      console.log("No messages found to notify! Check the active status and other parameters.");
      
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
          debug: debug || isEmergency, // Always enable debug mode for emergency messages
          forceSend: forceSend || isFromWhatsApp, // FIXED: Force send for WhatsApp triggers
          bypassDeduplication: isFromWhatsApp || bypassDeduplication, // FIXED: Bypass deduplication for WhatsApp
          source: source // ADDED: Pass source to notification service
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
