
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { supabaseClient } from "./supabase-client.ts";
import { processDueReminders } from "./reminder-processor.ts";

console.log("===== SEND REMINDER EMAILS FUNCTION =====");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received request:", JSON.stringify(body));
    
    const { 
      messageId, 
      debug = false, 
      forceSend = false, 
      source = "manual",
      action = "process",
      forceReset = false
    } = body;
    
    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}, forceReset=${forceReset}`);
    
    // Handle different actions
    if (action === "reset") {
      console.log("Resetting failed reminders and creating new ones...");
      const supabase = supabaseClient();
      
      // Reset stuck reminders
      const { error: resetError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'pending',
          last_attempt_at: null,
          updated_at: new Date().toISOString()
        })
        .in('status', ['processing', 'failed'])
        .lt('retry_count', 3);
      
      if (resetError) {
        console.error("Error resetting reminders:", resetError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "Reminders reset successfully" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Process reminders using the enhanced dual-channel processor
    console.log("Processing check-in reminders for creators...");
    const results = await processDueReminders(messageId, forceSend, debug);
    
    console.log(`Processing complete: ${results.successCount} successful, ${results.failedCount} failed out of ${results.processedCount} total`);
    
    return new Response(
      JSON.stringify({
        success: true,
        processedCount: results.processedCount,
        successCount: results.successCount,
        failedCount: results.failedCount,
        results: results.results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
