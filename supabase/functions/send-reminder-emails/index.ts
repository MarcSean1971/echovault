
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { processDueReminders } from "./reminder-processor.ts";
import { checkForDueReminders, checkForStuckReminders, getReminderStats } from "./reminder-checker.ts";
import { supabaseClient } from "./supabase-client.ts";

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
    
    // Handle different actions
    switch (action) {
      case 'fix-stuck':
        console.log("Fixing stuck reminders...");
        const resetCount = await checkForStuckReminders();
        return new Response(JSON.stringify({ 
          success: true, 
          count: resetCount,
          message: `Fixed ${resetCount} stuck reminders`
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      case 'stats':
        console.log("Getting reminder statistics...");
        const stats = await getReminderStats();
        return new Response(JSON.stringify({ 
          success: true, 
          stats: stats
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      case 'regenerate-schedule':
        console.log(`Regenerating schedule for message ${messageId}...`);
        if (!messageId) {
          return new Response(JSON.stringify({
            success: false,
            error: "messageId required for regenerate-schedule action"
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // Mark existing reminders as obsolete and regenerate
        const supabase = supabaseClient();
        await supabase
          .from('reminder_schedule')
          .update({ status: 'obsolete' })
          .eq('message_id', messageId)
          .eq('status', 'pending');
          
        // The regeneration will be handled by the reminder generation service
        return new Response(JSON.stringify({
          success: true,
          message: `Regenerated reminder schedule for message ${messageId}`
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      case 'process':
      default:
        // Process due reminders (main action)
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
