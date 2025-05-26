
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processDueReminders } from "./services/reminder-processor.ts";
import { corsHeaders } from "./cors-headers.ts";

/**
 * Simplified reminder processing - handles only check-in reminders to creators
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
      action = "process" 
    } = requestBody;

    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}`);

    if (action === "process") {
      console.log("Processing check-in reminders for creators...");
      
      const results = await processDueReminders(messageId, forceSend, debug);
      
      console.log(`Processing complete: ${results.successCount} successful, ${results.failedCount} failed out of ${results.processedCount} total`);
      
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
