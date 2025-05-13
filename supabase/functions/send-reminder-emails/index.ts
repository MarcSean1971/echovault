
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesNeedingReminders } from "./db-service.ts";
import { sendReminder } from "./reminder-service.ts";
import { corsHeaders } from "./utils/env.ts";

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
    
    console.log(`Processing reminders at ${new Date().toISOString()}`);
    console.log(`Debug mode: ${debug ? "enabled" : "disabled"}`);
    console.log(`Force send: ${forceSend ? "enabled" : "disabled"}`);
    
    if (messageId) {
      console.log(`Processing specific message: ${messageId}`);
    }
    
    // Get messages that need reminders
    const messagesToRemind = await getMessagesNeedingReminders(messageId, forceSend);
    console.log(`Found ${messagesToRemind.length} messages that need reminders`);
    
    if (messagesToRemind.length === 0) {
      if (messageId) {
        console.log(`No reminders needed for message ${messageId} at this time`);
      } else {
        console.log("No reminders needed at this time");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No reminders needed at this time",
          successful_reminders: 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Process reminders
    const results = [];
    let successfulReminderCount = 0;
    
    for (const messageToRemind of messagesToRemind) {
      try {
        console.log(`Sending reminder for message ${messageToRemind.message.id}`);
        
        const reminderResult = await sendReminder(messageToRemind, debug);
        
        // Count successful reminders
        if (reminderResult.success) {
          successfulReminderCount += reminderResult.results.filter(r => r.success).length;
        }
        
        results.push({
          message_id: messageToRemind.message.id,
          condition_id: messageToRemind.condition.id,
          condition_type: messageToRemind.condition.condition_type,
          success: reminderResult.success,
          results: reminderResult.results
        });
      } catch (error) {
        console.error(`Error sending reminder for message ${messageToRemind.message.id}:`, error);
        results.push({
          message_id: messageToRemind.message.id,
          condition_id: messageToRemind.condition.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    console.log(`Reminder processing complete. Successful reminders: ${successfulReminderCount}`);
    
    return new Response(
      JSON.stringify({
        success: successfulReminderCount > 0,
        successful_reminders: successfulReminderCount,
        condition_type: messagesToRemind.length > 0 ? messagesToRemind[0].condition.condition_type : null,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error(`Error in send-reminder-emails function:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
