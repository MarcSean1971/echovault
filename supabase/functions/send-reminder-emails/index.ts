
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processDueReminders } from "./reminder-processor.ts";
import { getMonitoringStatus } from "./monitoring.ts";
import { sendCreatorTestReminder } from "./services/test-reminder-service.ts"; // New import

// Define CORS headers
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
    // Get URL to check if this is a status request
    const url = new URL(req.url);
    if (url.pathname.endsWith('/status')) {
      console.log("Health check request received");
      const status = await getMonitoringStatus();
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
    
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      requestData = {};
    }
    
    const { 
      messageId,
      action = 'process', 
      debug = false, 
      forceSend = false,
      source = 'api',
      batchSize = 50,
      testMode = false // New parameter
    } = requestData;
    
    console.log("====== REMINDER SERVICE STARTED ======");
    console.log(`Processing reminders at ${new Date().toISOString()}`);
    console.log(`Debug mode: ${debug ? 'enabled' : 'disabled'}`);
    console.log(`Force send: ${forceSend ? 'enabled' : 'disabled'}`);
    console.log(`Test mode: ${testMode ? 'enabled' : 'disabled'}`);
    console.log(`Action: ${action}`);
    
    // NEW: Direct test reminder to creator path
    if (testMode && messageId) {
      console.log(`Test mode enabled for message ${messageId} - sending direct reminder to creator`);
      const testResult = await sendCreatorTestReminder(messageId, debug);
      
      console.log(`Test reminder result:`, testResult);
      
      if (testResult.success) {
        return new Response(
          JSON.stringify({
            success: true,
            processed: 1,
            successful: 1,
            failed: 0,
            skipped: 0,
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
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: testResult.error || "Test reminder failed",
            timestamp: new Date().toISOString(),
            testMode: true
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    // Process the reminders with enhanced logging
    console.log(`[OPTIMIZED] Processing reminders with batch size ${batchSize}`);
    console.log(`[OPTIMIZED] Target message ID: ${messageId || 'None (processing all due reminders)'}`);
    
    // Get and process due reminders
    const processingResults = await processDueReminders(batchSize, messageId, debug, forceSend);
    
    // Parse the results
    const { 
      processedCount = 0,
      successCount = 0,
      failedCount = 0,
      skippedCount = 0,
      results = []
    } = processingResults || {};
    
    // AGGRESSIVE: If this is a direct request with messageId and there are no results, 
    // but forceSend is true, force a message notification anyway
    if (messageId && forceSend && processedCount === 0) {
      console.log("No due reminders found, but forceSend is enabled - triggering direct message notification");
      
      try {
        // Direct call to the notification function
        const notifResponse = await fetch(
          `https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs`,
            },
            body: JSON.stringify({
              messageId: messageId,
              debug: true,
              forceSend: true,
              source: "reminder-force-fallback",
              testMode: testMode // Pass testMode to notification function
            })
          }
        );
        
        if (notifResponse.ok) {
          const notifResult = await notifResponse.json();
          console.log("Direct notification successful:", notifResult);
          
          // Add this to the results
          results.push({
            success: true,
            message_id: messageId,
            method: 'direct-notification',
            result: notifResult
          });
        } else {
          console.error("Direct notification failed:", await notifResponse.text());
        }
      } catch (directError) {
        console.error("Error in direct notification call:", directError);
      }
    }
    
    // Log summary
    console.log("====== REMINDER SERVICE SUMMARY ======");
    console.log(`Total reminders processed: ${processedCount}`);
    console.log(`Successful reminders: ${successCount}`);
    console.log(`Failed reminders: ${failedCount}`);
    console.log(`Skipped reminders: ${skippedCount}`);
    console.log("====== REMINDER SERVICE FINISHED ======");
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        successful: successCount,
        failed: failedCount,
        skipped: skippedCount,
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
  } catch (error) {
    console.error("Error in send-reminder-emails function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
        stack: error.stack || "No stack trace available",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
