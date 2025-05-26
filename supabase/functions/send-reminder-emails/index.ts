
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processDueReminders, resetAndCreateReminders } from "./services/reminder-processor.ts";
import { corsHeaders } from "./cors-headers.ts";

/**
 * Enhanced reminder processing with improved retry logic and force reset
 */
serve(async (req) => {
  console.log("===== SEND REMINDER EMAILS FUNCTION =====");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Received request:", JSON.stringify(requestBody));

    const { 
      messageId, 
      debug = false, 
      forceSend = false, 
      source = "manual",
      action = "process",
      forceReset = false
    } = requestBody;

    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}, forceReset=${forceReset}`);

    if (action === "reset") {
      console.log("Resetting failed reminders and creating new ones...");
      
      const { resetCount, createdCount } = await resetAndCreateReminders();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Reset ${resetCount} failed reminders and created ${createdCount} new reminders`,
          resetCount,
          createdCount,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (action === "process") {
      // Force reset before processing if requested
      if (forceReset) {
        console.log("Force reset requested before processing...");
        const { resetCount, createdCount } = await resetAndCreateReminders();
        console.log(`Force reset complete: ${resetCount} reset, ${createdCount} created`);
      }
      
      console.log("Processing check-in reminders for creators...");
      
      const results = await processDueReminders(messageId, forceSend, debug);
      
      console.log(`Processing complete: ${results.successCount} successful, ${results.failedCount} failed out of ${results.processedCount} total`);
      
      if (results.errors.length > 0) {
        console.log("Errors encountered:", results.errors);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Processed ${results.processedCount} reminders: ${results.successCount} successful, ${results.failedCount} failed`,
          results: results,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "No action specified - reminder processing skipped",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
