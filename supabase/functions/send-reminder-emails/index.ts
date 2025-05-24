
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { processDueReminders } from "./reminder-processor.ts";
import { checkForDueReminders } from "./reminder-checker.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log("===== SEND REMINDER EMAILS FUNCTION =====");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json().catch(() => ({}));
    console.log("Received request:", JSON.stringify(body));
    
    const {
      messageId,
      debug = false,
      forceSend = false,
      source = 'manual',
      action = 'process'
    } = body;
    
    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}`);
    
    // Handle stuck reminder cleanup
    if (action === 'fix-stuck') {
      console.log("Fixing stuck reminders...");
      
      const { data: stuckReminders, error: cleanupError } = await supabaseClient()
        .from('reminder_schedule')
        .update({ 
          status: 'pending',
          retry_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'processing')
        .lt('last_attempt_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes ago
        .select('id');
      
      if (!cleanupError && stuckReminders) {
        console.log(`Fixed ${stuckReminders.length} stuck reminders`);
        return new Response(JSON.stringify({ 
          success: true, 
          count: stuckReminders.length,
          message: `Fixed ${stuckReminders.length} stuck reminders`
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Process due reminders
    console.log("Processing due reminders...");
    
    if (messageId) {
      console.log(`Processing reminders for specific message: ${messageId}`);
      const results = await processDueReminders(messageId, forceSend, debug);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Processed ${results.processedCount} reminders for message ${messageId}`,
        results: results
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      console.log("Checking for all due reminders");
      const dueReminders = await checkForDueReminders(forceSend, debug);
      
      if (dueReminders.length === 0) {
        console.log("No due reminders found");
        return new Response(JSON.stringify({
          success: true,
          message: "No due reminders found",
          count: 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Process the due reminders
      const messageIds = [...new Set(dueReminders.map(r => r.message_id))];
      const allResults = [];
      
      for (const msgId of messageIds) {
        const results = await processDueReminders(msgId, forceSend, debug);
        allResults.push(results);
      }
      
      const totalProcessed = allResults.reduce((sum, r) => sum + r.processedCount, 0);
      const totalSuccess = allResults.reduce((sum, r) => sum + r.successCount, 0);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Processed ${totalProcessed} reminders, ${totalSuccess} successful`,
        totalProcessed,
        totalSuccess,
        results: allResults
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

function supabaseClient() {
  // Import the supabase client here to avoid circular dependencies
  const { createClient } = require("https://esm.sh/@supabase/supabase-js@2.39.7");
  
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}
