
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesNeedingReminders } from "./db-service.ts";
import { sendReminder } from "./reminder-service.ts";

// Define CORS headers here instead of importing them
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    let body: { messageId?: string; debug?: boolean; forceSend?: boolean } = {};
    
    try {
      body = await req.json();
    } catch (e) {
      // If parsing fails, use an empty object
      console.log("No valid JSON body provided");
    }
    
    const { messageId, debug = false, forceSend = false } = body;
    
    console.log(`====== REMINDER CHECK STARTED ======`);
    console.log(`Processing reminders at ${new Date().toISOString()}`);
    console.log(`Debug mode: ${debug ? "enabled" : "disabled"}`);
    console.log(`Force send: ${forceSend ? "enabled" : "disabled"}`);
    
    if (messageId) {
      console.log(`Processing specific message: ${messageId}`);
    }
    
    // Get messages that need reminders
    console.log("Fetching messages that need reminders...");
    const messagesToRemind = await getMessagesNeedingReminders(messageId, forceSend);
    console.log(`Found ${messagesToRemind.length} messages that need reminders`);
    
    if (messagesToRemind.length === 0) {
      if (messageId) {
        console.log(`No reminders needed for message ${messageId} at this time`);
        console.log("Possible reasons:");
        console.log("1. No reminder time matches the current time window (within 15 minutes)")
        console.log("2. Message is not armed/active")
        console.log("3. No reminder_hours configured")
        console.log("4. No trigger_date set and forceSend=false")
        
        // If forceSend was requested but still no reminders, that's strange
        if (forceSend) {
          console.log("WARNING: forceSend was true but still no reminders found!");
          console.log("Check that the message exists and is active");
        }
      } else {
        console.log("No reminders needed at this time");
      }
      
      console.log(`====== REMINDER CHECK FINISHED ======`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: messageId && forceSend ? 
            "No reminders could be sent - check message exists and is active" : 
            "No reminders needed at this time",
          successful_reminders: 0,
          timestamp: new Date().toISOString(),
          checked_message_id: messageId || null,
          force_send_attempted: forceSend
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Process reminders
    console.log("Starting to process reminders...");
    const results = [];
    let successfulReminderCount = 0;
    let condition_type = null;
    
    for (const messageToRemind of messagesToRemind) {
      try {
        console.log(`Processing reminder for message ${messageToRemind.message.id} - "${messageToRemind.message.title}"`);
        console.log(`Condition type: ${messageToRemind.condition.condition_type}`);
        condition_type = messageToRemind.condition.condition_type;
        console.log(`Hours until deadline: ${messageToRemind.hoursUntilDeadline.toFixed(1)}`);
        
        // IMPORTANT: Add debug log to show proper reminder time interpretation
        if (messageToRemind.matchedReminderHour !== null) {
          const reminderMinutes = messageToRemind.matchedReminderHour;
          const reminderHours = reminderMinutes / 60;
          console.log(`Matched reminder time: ${reminderMinutes} minutes (${reminderHours.toFixed(2)} hours) before deadline`);
        } else if (forceSend) {
          console.log("No specific reminder time matched, but forceSend=true");
        }
        
        const reminderResult = await sendReminder(messageToRemind, true);
        
        // Count successful reminders
        if (reminderResult.success) {
          const successCount = reminderResult.results.filter(r => r.success).length;
          successfulReminderCount += successCount;
          console.log(`Successfully sent ${successCount} reminders for message ${messageToRemind.message.id}`);
        } else {
          console.log(`Failed to send reminders for message ${messageToRemind.message.id}`);
        }
        
        results.push({
          message_id: messageToRemind.message.id,
          condition_id: messageToRemind.condition.id,
          condition_type: messageToRemind.condition.condition_type,
          success: reminderResult.success,
          reminders_sent: reminderResult.results.filter(r => r.success).length,
          reminders_failed: reminderResult.results.filter(r => !r.success).length,
          details: reminderResult.results
        });
      } catch (error: any) {
        console.error(`Error processing reminder for message ${messageToRemind.message.id}:`, error);
        results.push({
          message_id: messageToRemind.message.id,
          condition_id: messageToRemind.condition.id,
          success: false,
          error: error.message || "Unknown error"
        });
      }
    }
    
    console.log(`\n====== REMINDER CHECK SUMMARY ======`);
    console.log(`Total messages processed: ${messagesToRemind.length}`);
    console.log(`Messages with successful reminders: ${results.filter(r => r.success).length}`);
    console.log(`Total successful reminders: ${successfulReminderCount}`);
    console.log(`====== REMINDER CHECK FINISHED ======`);

    return new Response(
      JSON.stringify({ 
        success: successfulReminderCount > 0, 
        messages_processed: messagesToRemind.length,
        successful_reminders: successfulReminderCount,
        condition_type,
        results,
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
    console.error("Error in send-reminder-emails function:", error);
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
