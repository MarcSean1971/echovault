
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { processDueReminders } from "./reminder-processor.ts";
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
    
    // Default action: process reminders
    console.log("Processing due reminders with enhanced error handling...");
    
    if (messageId) {
      console.log(`Checking for reminders for specific message: ${messageId}`);
    } else {
      console.log("Checking for all due reminders");
    }
    
    // CRITICAL FIX: Add proper time filtering in the query
    console.log("[REMINDER-CHECKER] Checking for due reminders...");
    const supabase = supabaseClient();
    
    let query = supabase
      .from('reminder_schedule')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString()); // FIXED: Only get reminders that are actually due
    
    if (messageId) {
      query = query.eq('message_id', messageId);
    }
    
    const { data: dueReminders, error: queryError } = await query.limit(50);
    
    if (queryError) {
      console.error("[REMINDER-CHECKER] Error querying due reminders:", queryError);
      throw queryError;
    }
    
    console.log(`[REMINDER-CHECKER] Found ${dueReminders?.length || 0} due reminders`);
    
    if (!dueReminders || dueReminders.length === 0) {
      console.log("No due reminders found");
      return new Response(JSON.stringify({
        success: true,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        message: "No due reminders found"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Process the reminders
    const result = await processDueReminders(messageId, forceSend, debug);
    
    console.log(`Processed ${result.processedCount} reminders. Success: ${result.successCount}, Failed: ${result.failedCount}`);
    
    return new Response(JSON.stringify({
      success: true,
      ...result
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
