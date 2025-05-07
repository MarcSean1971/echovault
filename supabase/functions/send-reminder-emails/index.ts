
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMessagesNeedingReminders } from "./db-service.ts";
import { sendReminder } from "./reminder-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  messageId?: string;
  debug?: boolean;
  forceSend?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestData: ReminderRequest = {};
    try {
      requestData = await req.json();
    } catch (error) {
      // Default to empty object if parsing fails
      console.log("Failed to parse request body, using default empty object");
    }
    
    const { messageId, debug = false, forceSend = false } = requestData;
    
    console.log("===== SEND REMINDER EMAILS =====");
    console.log(`Starting reminder process at ${new Date().toISOString()}`);
    console.log(`DEBUG MODE: ${debug ? 'Enabled' : 'Disabled'}`);
    console.log(`FORCE SEND: ${forceSend ? 'Enabled' : 'Disabled'}`);
    
    if (messageId) {
      console.log(`Processing reminders for specific message ID: ${messageId}`);
    } else {
      console.log("Processing reminders for all eligible messages");
    }
    
    // Get messages that need reminders
    const messagesToRemind = await getMessagesNeedingReminders(messageId, forceSend);
    
    if (debug) {
      console.log(`Found ${messagesToRemind.length} messages that need reminders`);
      console.log("Messages:", JSON.stringify(messagesToRemind.map(m => ({
        id: m.message.id,
        title: m.message.title,
        condition_id: m.condition.id,
        hours_until_deadline: m.hoursUntilDeadline,
        reminder_hours: m.reminderHours
      })), null, 2));
    }
    
    if (messagesToRemind.length === 0) {
      if (messageId) {
        console.log(`No reminders needed for message ${messageId}`);
        if (forceSend) {
          console.log("Force send enabled but no eligible messages found. Check if message exists and has reminders configured.");
        }
      } else {
        console.log("No reminders needed at this time");
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: messageId ? 
            `No reminders needed for message ${messageId}` : 
            "No reminders needed at this time",
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
    }

    // Send reminders
    const results = await Promise.all(
      messagesToRemind.map(message => sendReminder(message, debug))
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`===== REMINDER RESULTS =====`);
    console.log(`Success: ${successful}, Failed: ${failed}`);
    
    if (debug) {
      console.log("Detailed results:", JSON.stringify(results, null, 2));
    }
    
    console.log(`===== END REMINDER PROCESS =====`);

    return new Response(
      JSON.stringify({
        success: successful > 0,
        messages_processed: messagesToRemind.length,
        successful_reminders: successful,
        failed_reminders: failed,
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
