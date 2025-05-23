
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./utils.ts";
import { processReminders } from "./reminder-processor.ts";
import { updateNextReminderTime } from "./db/reminder-tracking.ts";
import { checkForDueReminders } from "./reminder-checker.ts";
import { testReminderDelivery } from "./reminder-tester.ts";
import { supabaseClient } from "./supabase-client.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request parameters
    const { 
      messageId, 
      forceSend = false,
      debug = false, 
      action = "process",
      testMode = false,
      source = "api-call",
      userId = null
    } = await req.json();
    
    console.log(`Request received: ${JSON.stringify({ debug, action, messageId, forceSend, testMode, source, userId })}`);
    console.log(`Request action: ${action}, forceSend: ${forceSend}, source: ${source}`);
    
    // Process based on requested action
    switch (action) {
      case "test-delivery":
        // Test the reminder delivery for a specific message
        if (!messageId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Missing required parameter: messageId"
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        // CRITICAL FIX: Use the userId parameter if provided for test deliveries
        const testResults = await testReminderDelivery(messageId, {
          debug,
          forceSend, 
          testMode: true,
          source,
          userId
        });
        
        return new Response(
          JSON.stringify({
            success: testResults.success,
            results: testResults.results,
            messageId
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );

      case "process":
      default:
        // Check for and process due reminders
        console.log("Checking for due reminders...");
        const dueRemindersResult = await checkForDueReminders(forceSend);
        console.log(`Found ${dueRemindersResult.length} due reminders`);
        
        // If there are due reminders or we're forcing, process them
        if (dueRemindersResult.length > 0 || forceSend) {
          if (messageId) {
            // Process specific message reminder
            const result = await processReminders([messageId], { debug, forceSend });
            
            return new Response(
              JSON.stringify({
                success: true,
                processed: result.length,
                results: result,
                message: `Processed ${result.length} reminders for message ${messageId}`
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          } else {
            // Process all due reminders
            const messageIds = dueRemindersResult.map(r => r.message_id);
            const uniqueMessageIds = [...new Set(messageIds)];
            const results = await processReminders(uniqueMessageIds, { debug, forceSend });
            
            return new Response(
              JSON.stringify({
                success: true,
                processed: results.length,
                results: results,
                message: `Processed ${results.length} reminders for ${uniqueMessageIds.length} messages`
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
            );
          }
        } else {
          // No due reminders to process
          return new Response(
            JSON.stringify({
              success: true,
              processed: 0,
              message: "No due reminders found"
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
              }
          );
        }
    }
  } catch (error) {
    // Log and return any errors
    console.error(`Error processing reminder request: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
