
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../shared/utils/cors-headers.ts";
import { createSuccessResponse, createErrorResponse } from "../shared/utils/response-formatters.ts";
import { processDueReminders } from "./reminder-processor.ts";
import { fixStuckReminders } from "./fix-stuck-reminders.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { 
      messageId, 
      debug = false, 
      forceSend = false, 
      source = "manual", 
      action = "process" 
    } = body;

    console.log("===== SEND REMINDER EMAILS FUNCTION =====");
    console.log(`Received request: ${JSON.stringify(body)}`);
    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}`);

    // Handle fix-stuck action first
    if (action === "fix-stuck") {
      console.log("Fixing stuck reminders...");
      
      try {
        const result = await fixStuckReminders(debug);
        
        console.log(`Fixed ${result.resetCount} stuck reminders and triggered ${result.triggeredCount} overdue deliveries`);
        
        return createSuccessResponse({
          action: "fix-stuck",
          resetCount: result.resetCount,
          triggeredCount: result.triggeredCount,
          timestamp: result.timestamp
        });
      } catch (error) {
        console.error("Error fixing stuck reminders:", error);
        return createErrorResponse(`Failed to fix stuck reminders: ${error.message}`, 500);
      }
    }

    // Process due reminders
    console.log("Processing due reminders...");
    
    if (messageId) {
      console.log(`Checking reminders for specific message: ${messageId}`);
    } else {
      console.log("Checking for all due reminders");
    }

    console.log("Checking for due reminders...");
    
    const results = await processDueReminders(messageId, forceSend, debug);
    
    console.log(`Found ${results.processedCount} due reminders`);
    
    if (results.processedCount === 0) {
      console.log("No due reminders found");
      
      // If no due reminders but forceSend is true, try to fix stuck reminders
      if (forceSend) {
        console.log("Force send requested, checking for stuck reminders...");
        try {
          const fixResult = await fixStuckReminders(debug);
          if (fixResult.triggeredCount > 0) {
            return createSuccessResponse({
              processedCount: 0,
              successCount: 0,
              failedCount: 0,
              results: [],
              fixedStuck: true,
              triggeredCount: fixResult.triggeredCount
            });
          }
        } catch (fixError) {
          console.error("Error fixing stuck reminders during force send:", fixError);
        }
      }
    }

    return createSuccessResponse({
      processedCount: results.processedCount,
      successCount: results.successCount,
      failedCount: results.failedCount,
      results: results.results
    });

  } catch (error) {
    console.error("Error in send-reminder-emails:", error);
    return createErrorResponse(error.message, 500);
  }
});
