
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processDueReminders } from "./reminder-processor.ts";
import { getMonitoringStatus } from "./monitoring.ts";

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
    // Parse the request body
    let body: { messageId?: string; debug?: boolean; forceSend?: boolean; action?: string } = {};
    
    try {
      body = await req.json();
    } catch (e) {
      // If parsing fails, use an empty object
      console.log("No valid JSON body provided");
    }
    
    const { messageId, debug = false, forceSend = false, action = 'process' } = body;
    
    console.log(`====== REMINDER SERVICE STARTED ======`);
    console.log(`Processing reminders at ${new Date().toISOString()}`);
    console.log(`Debug mode: ${debug ? "enabled" : "disabled"}`);
    console.log(`Force send: ${forceSend ? "enabled" : "disabled"}`);
    console.log(`Action: ${action}`);
    
    if (messageId) {
      console.log(`Target message ID: ${messageId}`);
    }
    
    // If action is 'status', return monitoring information
    if (action === 'status') {
      const status = await getMonitoringStatus();
      console.log(`====== REMINDER SERVICE STATUS ======`);
      console.log(`Due reminders: ${status.dueReminders}`);
      console.log(`Sent in last 5 minutes: ${status.sentLastFiveMin}`);
      console.log(`Failed in last 5 minutes: ${status.failedLastFiveMin}`);
      console.log(`====== REMINDER SERVICE FINISHED ======`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          status,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Process due reminders
    const results = await processDueReminders(messageId, forceSend, debug);
    
    console.log(`====== REMINDER SERVICE SUMMARY ======`);
    console.log(`Total reminders processed: ${results.totalProcessed}`);
    console.log(`Successful reminders: ${results.successful}`);
    console.log(`Failed reminders: ${results.failed}`);
    console.log(`Skipped reminders: ${results.skipped}`);
    console.log(`====== REMINDER SERVICE FINISHED ======`);

    return new Response(
      JSON.stringify({ 
        success: results.successful > 0 || results.totalProcessed === 0, 
        results,
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
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        stack: error.stack || "No stack trace available",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
