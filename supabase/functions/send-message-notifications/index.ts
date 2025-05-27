import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesToNotify } from "./db/index.ts";
import { sendMessageNotification } from "./notification-service.ts";
import { MessageNotificationRequest } from "./types.ts";
import { supabaseClient } from "./supabase-client.ts";
import { getSystemHealthStatus } from "./db/system-health.ts";
import { sendCreatorTestNotification } from "./test-notification-service.ts";

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
      keepArmed = undefined, 
      forceSend = false, 
      source = 'api',
      testMode = false,
      bypassDeduplication = false
    } = requestData;
    
    console.log(`===== SEND MESSAGE NOTIFICATIONS WITH DEADLINE VALIDATION =====`);
    console.log(`Starting notification process at ${new Date().toISOString()}`);
    console.log(`DEBUG MODE: ${debug ? 'Enabled' : 'Disabled'}`);
    console.log(`Processing message notifications${messageId ? ` for message ID: ${messageId}` : ''}`);
    console.log(`Is emergency notification: ${isEmergency ? 'YES' : 'No'}`);
    console.log(`Force send: ${forceSend ? 'YES' : 'No'}`);
    console.log(`Bypass deduplication: ${bypassDeduplication ? 'YES' : 'No'}`);
    console.log(`Test mode: ${testMode ? 'YES' : 'No'}`);
    console.log(`Source: ${source}`);
    
    // CRITICAL FIX: Check if this is reminder-triggered and should skip recipient notifications
    const isReminderTriggered = source && (
      source === 'reminder_schedule_trigger' ||
      source === 'reminder-schedule-direct-trigger' ||
      source === 'reminder-schedule-update' ||
      source === 'obsolete-immediate-check' ||
      source === 'reliable-trigger-primary' ||
      source === 'reliable-trigger-backup'
    );
    
    const skipRecipientNotifications = isReminderTriggered;
    
    if (skipRecipientNotifications) {
      console.log(`CRITICAL FIX: Reminder-triggered notification detected from ${source}`);
      console.log(`SKIPPING recipient notifications - this should ONLY send check-in reminders to creators`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reminder-triggered: Skipping recipient notifications to prevent dual notifications",
          source: source,
          skipReason: "Reminder system handles check-in notifications to creators only",
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
    }
    
    // Check if this is from WhatsApp selection
    const isFromWhatsApp = source && (
      source === 'whatsapp_trigger_single' || 
      source === 'whatsapp_selection_single' || 
      source === 'whatsapp_selection_all' ||
      source === 'whatsapp_selection_fallback' ||
      source === 'whatsapp-checkin'
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
      
      if (source === 'reminder_schedule_trigger') {
        console.log(`Triggered by reminder_schedule status change to 'sent'`);
      }
    }
    
    if (keepArmed !== undefined) {
      console.log(`Keep armed flag explicitly set to: ${keepArmed}`);
    }
    
    // CRITICAL FIX: Always use forceSend for WhatsApp triggers (but not reminder triggers)
    const effectiveForceSend = forceSend || isFromWhatsApp;
    
    // Get messages that need notification with ENHANCED deadline validation
    console.log(`[DEADLINE-CHECK] Fetching messages with strict deadline validation (forceSend: ${effectiveForceSend})`);
    const messagesToNotify = await getMessagesToNotify(messageId, effectiveForceSend); 
    console.log(`[DEADLINE-CHECK] Found ${messagesToNotify.length} messages that passed deadline validation out of ${messageId ? '1 requested' : 'all active conditions'}`);
    
    if (messagesToNotify.length === 0 && messageId) {
      const supabase = supabaseClient();
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('id, title')
        .eq('id', messageId)
        .single();
        
      const { data: conditionData, error: conditionError } = await supabase
        .from('message_conditions')
        .select('id, condition_type, active, last_checked, hours_threshold, minutes_threshold')
        .eq('message_id', messageId)
        .single();
      
      if (messageData) {
        console.log(`[DEADLINE-CHECK] Requested message ${messageId} exists with title: "${messageData.title}"`);
        
        if (conditionData) {
          console.log(`[DEADLINE-CHECK] Message has condition type: ${conditionData.condition_type}, active: ${conditionData.active}`);
          
          if (conditionData.condition_type === 'no_check_in' && conditionData.last_checked) {
            const now = new Date();
            const lastChecked = new Date(conditionData.last_checked);
            const actualDeadline = new Date(lastChecked);
            actualDeadline.setHours(actualDeadline.getHours() + (conditionData.hours_threshold || 0));
            actualDeadline.setMinutes(actualDeadline.getMinutes() + (conditionData.minutes_threshold || 0));
            
            const minutesUntilDeadline = (actualDeadline.getTime() - now.getTime()) / (1000 * 60);
            
            console.log(`[DEADLINE-CHECK] Deadline analysis - Last checked: ${lastChecked.toISOString()}, Deadline: ${actualDeadline.toISOString()}, Minutes until: ${minutesUntilDeadline.toFixed(2)}`);
            
            if (minutesUntilDeadline > 0) {
              console.log(`[DEADLINE-CHECK] Message NOT included because deadline not reached yet (${minutesUntilDeadline.toFixed(2)} minutes remaining)`);
            }
          }
          
          if (!conditionData.active) {
            console.log("[DEADLINE-CHECK] Message condition is not active, that's why it wasn't included");
            
            if (effectiveForceSend) {
              console.log("[DEADLINE-CHECK] Force send or WhatsApp trigger is enabled, trying to process this message anyway");
              
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
                const forcedMessage = {
                  message: fullMessageData,
                  condition: fullConditionData
                };
                
                console.log("[DEADLINE-CHECK] Forcing notification for:", forcedMessage);
                
                await sendMessageNotification(forcedMessage, {
                  isEmergency,
                  debug: true,
                  forceSend: true,
                  bypassDeduplication: isFromWhatsApp || bypassDeduplication,
                  skipRecipientNotifications: false // Allow recipients for forced messages
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
          console.log(`[DEADLINE-CHECK] Message exists but has no conditions: ${conditionError?.message || 'No condition found'}`);
        }
      } else {
        console.log(`[DEADLINE-CHECK] Requested message ID ${messageId} not found: ${messageError?.message || 'Message not found'}`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No messages found to notify - deadline not reached or conditions not met",
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
      console.log("[DEADLINE-CHECK] No messages found to notify! Check the active status and deadline validation.");
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No messages found to notify - deadlines not reached",
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
          message.condition.panic_config.keep_armed = keepArmed;
          console.log(`Updated panic_config.keep_armed to ${keepArmed} for message ${message.message.id}`);
        }
      });
    }

    // Send notifications for each message with ENHANCED deadline validation
    console.log(`[DEADLINE-CHECK] Processing ${messagesToNotify.length} messages with enhanced deadline validation`);
    const results = await Promise.all(
      messagesToNotify.map(message => 
        sendMessageNotification(message, {
          isEmergency,
          debug: debug || isEmergency,
          forceSend: effectiveForceSend,
          bypassDeduplication: isFromWhatsApp || bypassDeduplication,
          source: source,
          skipRecipientNotifications: false // Normal notifications should send to recipients
        })
      )
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Log detailed results
    console.log(`===== NOTIFICATION RESULTS WITH DEADLINE VALIDATION =====`);
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
        timestamp: new Date().toISOString(),
        deadlineValidationApplied: true
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
