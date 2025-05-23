
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./utils.ts";
import { processReminders } from "./reminder-processor.ts";
import { getMessagesNeedingReminders } from "./db-service.ts";
import { checkForDueReminders } from "./reminder-checker.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const body = await req.json().catch(() => ({}));
    console.log("Received request:", JSON.stringify(body));
    
    const { 
      messageId, 
      debug = false, 
      forceSend = false,
      source = "manual",
      action = "process" // New parameter to control behavior
    } = body;
    
    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}`);
    
    // Handle different types of actions
    if (action === "fix-stuck") {
      // Fix stuck reminders - updates reminders stuck in 'processing' status for more than 5 minutes
      console.log("Fixing stuck reminders...");
      const supabase = await import("./supabase-client.ts").then(m => m.supabaseClient());
      
      const { data, error } = await supabase
        .from('reminder_schedule')
        .update({ 
          status: 'pending',
          retry_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'processing')
        .lt('last_attempt_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
        
      console.log(`Fixed ${data?.length || 0} stuck reminders. Error: ${error?.message || 'None'}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: "fix-stuck",
          count: data?.length || 0
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    else if (action === "update-after-checkin") {
      // Special action when a check-in has occurred - update reminder schedules
      console.log("Updating reminder schedule after check-in");
      if (!messageId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required parameter: messageId" }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Get message conditions needing reminders with the latest check-in info
      const messages = await getMessagesNeedingReminders(messageId, true);
      
      if (messages.length === 0) {
        console.log(`No messages found for message ID ${messageId} or no reminders needed`);
        return new Response(
          JSON.stringify({ success: true, messages: 0, message: "No reminders needed" }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      console.log(`Found ${messages.length} messages that need reminder updates after check-in`);
      
      // Process reminders for each message
      const results = await processReminders([messageId], { debug: true, forceSend: false });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Reminders updated after check-in",
          results 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    else {
      // Default behavior: Process due reminders
      console.log("Processing due reminders...");
      
      let processingResults;
      
      if (messageId) {
        // If a specific message ID is provided, check that message specifically
        console.log(`Checking specific message ID: ${messageId}`);
        
        // Get messages needing reminders
        const messages = await getMessagesNeedingReminders(messageId, forceSend);
        
        if (messages.length === 0) {
          console.log(`No reminders needed for message ID ${messageId}`);
          return new Response(
            JSON.stringify({ success: true, messages: 0, message: "No reminders needed" }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        console.log(`Found ${messages.length} messages that need reminders`);
        
        // Process reminders for the specific message
        processingResults = await processReminders([messageId], { debug, forceSend });
      } else {
        // If no specific message ID, check for all due reminders
        console.log("Checking for all due reminders");
        
        // Get due reminders from the database with atomic locking
        const dueReminders = await checkForDueReminders(forceSend, debug);
        
        if (dueReminders.length === 0) {
          console.log("No due reminders found");
          return new Response(
            JSON.stringify({ success: true, reminders: 0, message: "No due reminders" }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        // Get unique message IDs from due reminders
        const messageIds = [...new Set(dueReminders.map(r => r.message_id))];
        console.log(`Found ${messageIds.length} unique messages with due reminders`);
        
        // Process all due reminders
        processingResults = await processReminders(messageIds, { debug, forceSend });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          source,
          results: processingResults 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
