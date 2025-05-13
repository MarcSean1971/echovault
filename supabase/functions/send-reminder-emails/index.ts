
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
        console.log("Reminder reasons that could cause this:");
        console.log("1. No reminder time matches the current time window (within 7.5 minutes)")
        console.log("2. Message is not armed/active")
        console.log("3. No recipients configured")
      } else {
        console.log("No reminders needed at this time");
      }
      
      console.log(`====== REMINDER CHECK FINISHED ======`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No reminders needed at this time",
          successful_reminders: 0,
          timestamp: new Date().toISOString()
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
    
    for (const messageToRemind of messagesToRemind) {
      try {
        console.log(`Sending reminder for message ${messageToRemind.message.id} - "${messageToRemind.message.title}"`);
        console.log(`Condition type: ${messageToRemind.condition.condition_type}`);
        console.log(`Hours until deadline: ${messageToRemind.hoursUntilDeadline.toFixed(1)}`);
        
        // IMPORTANT: Add debug log to show proper reminder time interpretation
        if (messageToRemind.matchedReminderHour !== null) {
          const reminderMinutes = messageToRemind.matchedReminderHour;
          const reminderHours = reminderMinutes / 60;
          console.log(`Matched reminder time: ${reminderMinutes} minutes (${reminderHours.toFixed(2)} hours) before deadline`);
        }
        
        const reminderResult = await sendReminder(messageToRemind, debug);
        
        // Count successful reminders
        if (reminderResult.success) {
          successfulReminderCount += reminderResult.results.filter(r => r.success).length;
          console.log(`Successfully sent ${reminderResult.results.filter(r => r.success).length} reminders for message ${messageToRemind.message.id}`);
        } else {
          console.log(`Failed to send reminders for message ${messageToRemind.message.id}`);
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
    console.log(`====== REMINDER CHECK FINISHED ======`);
    
    return new Response(
      JSON.stringify({
        success: successfulReminderCount > 0,
        successful_reminders: successfulReminderCount,
        condition_type: messagesToRemind.length > 0 ? messagesToRemind[0].condition.condition_type : null,
        results,
        timestamp: new Date().toISOString()
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
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
