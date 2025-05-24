
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { processDueReminders } from "./services/reminder-processor.ts";
import { cleanupFailedReminders } from "./cleanup-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("===== SEND REMINDER EMAILS FUNCTION =====");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody = {};
    
    try {
      const text = await req.text();
      if (text) {
        requestBody = JSON.parse(text);
      }
    } catch (e) {
      console.log("No body or invalid JSON, using empty object");
    }
    
    console.log("Received request:", JSON.stringify(requestBody));
    
    const {
      messageId,
      debug = false,
      forceSend = false,
      source = "manual",
      action = "process"
    } = requestBody as any;
    
    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}`);
    
    // Handle different actions
    if (action === "cleanup") {
      console.log("Running cleanup service...");
      const cleanupResult = await cleanupFailedReminders(debug);
      
      return new Response(JSON.stringify({
        success: true,
        action: "cleanup",
        cleaned: cleanupResult.cleaned,
        errors: cleanupResult.errors
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    if (action === "regenerate-schedule") {
      console.log(`Regenerating schedule for message ${messageId}...`);
      
      // For regeneration, we first clean up old reminders for this message
      const supabase = supabaseClient();
      
      // Mark existing reminders as obsolete
      const { error: obsoleteError } = await supabase
        .from('reminder_schedule')
        .update({ status: 'obsolete' })
        .eq('message_id', messageId)
        .in('status', ['pending', 'processing']);
      
      if (obsoleteError) {
        console.error("Error marking reminders as obsolete:", obsoleteError);
      } else {
        console.log(`Marked existing reminders as obsolete for message ${messageId}`);
      }
      
      return new Response(JSON.stringify({
        success: true,
        action: "regenerate-schedule",
        message: "Schedule regeneration completed"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Default action: process reminders with enhanced logic
    console.log("Processing due reminders with enhanced separation logic...");
    
    if (messageId) {
      console.log(`Checking for reminders for specific message: ${messageId}`);
    } else {
      console.log("Checking for all due reminders");
    }
    
    // CRITICAL FIX: Use the enhanced processDueReminders function
    const result = await processDueReminders(messageId, forceSend, debug);
    
    console.log(`Enhanced processing complete: ${result.processedCount} processed, ${result.successCount} successful, ${result.failedCount} failed`);
    
    return new Response(JSON.stringify({
      success: true,
      processedCount: result.processedCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors,
      message: result.processedCount === 0 ? "No due reminders found" : "Reminders processed successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error",
      details: error.toString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
