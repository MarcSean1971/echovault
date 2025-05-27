
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";

console.log("===== SEND REMINDER EMAILS FUNCTION (CHECK-IN REMINDERS ONLY) =====");

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
      source = "manual"
    } = body;
    
    console.log(`Processing check-in reminders for creators only`);
    console.log(`Parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}`);
    
    const supabase = supabaseClient();
    
    // Get armed conditions that need check-in reminders
    let query = supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        condition_type,
        active,
        last_checked,
        hours_threshold,
        minutes_threshold,
        messages!inner(
          id,
          title,
          user_id
        )
      `)
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date']);

    if (messageId) {
      query = query.eq('message_id', messageId);
    }

    const { data: conditions, error: conditionsError } = await query;

    if (conditionsError) {
      console.error("Error fetching conditions:", conditionsError);
      throw conditionsError;
    }

    console.log(`Found ${conditions?.length || 0} armed conditions`);

    if (!conditions || conditions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processedCount: 0,
          successCount: 0,
          failedCount: 0,
          results: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    // Process each condition for check-in reminders
    for (const condition of conditions) {
      try {
        const message = condition.messages;
        
        // Calculate time until deadline
        const now = new Date();
        const lastChecked = new Date(condition.last_checked);
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
        deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
        
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
        
        console.log(`Processing check-in reminder for message ${message.id}, hours until deadline: ${diffHours.toFixed(2)}`);
        
        // Send check-in reminder to creator
        const reminderResults = await sendCreatorReminder(
          message.id,
          condition.id,
          message.title,
          message.user_id,
          diffHours,
          new Date().toISOString(),
          debug
        );
        
        const conditionSuccessCount = reminderResults.filter(r => r.success).length;
        
        if (conditionSuccessCount > 0) {
          successCount++;
        } else {
          failedCount++;
        }
        
        results.push({
          messageId: message.id,
          conditionId: condition.id,
          success: conditionSuccessCount > 0,
          reminderResults: reminderResults
        });
        
      } catch (error: any) {
        console.error(`Error processing condition ${condition.id}:`, error);
        failedCount++;
        results.push({
          messageId: condition.message_id,
          conditionId: condition.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Check-in reminder processing complete: ${successCount} successful, ${failedCount} failed out of ${conditions.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: conditions.length,
        successCount,
        failedCount,
        results
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
