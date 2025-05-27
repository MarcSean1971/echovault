
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";

console.log("===== SEND REMINDER EMAILS FUNCTION (SCHEDULED REMINDERS ONLY) =====");

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
    
    console.log(`Processing scheduled reminders from reminder_schedule table`);
    console.log(`Parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}`);
    
    const supabase = supabaseClient();
    
    // Get DUE reminders from the reminder_schedule table
    let query = supabase
      .from('reminder_schedule')
      .select(`
        id,
        message_id,
        condition_id,
        scheduled_at,
        reminder_type,
        status,
        messages!inner(
          id,
          title,
          user_id
        ),
        message_conditions!inner(
          id,
          condition_type,
          hours_threshold,
          minutes_threshold,
          last_checked
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .in('reminder_type', ['reminder']); // Only process check-in reminders, not final deliveries

    if (messageId) {
      query = query.eq('message_id', messageId);
    }

    const { data: dueReminders, error: remindersError } = await query;

    if (remindersError) {
      console.error("Error fetching due reminders:", remindersError);
      throw remindersError;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders in schedule`);

    if (!dueReminders || dueReminders.length === 0) {
      console.log("No due reminders found in schedule");
      return new Response(
        JSON.stringify({
          success: true,
          processedCount: 0,
          successCount: 0,
          failedCount: 0,
          results: [],
          message: "No due reminders found"
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

    // Process each DUE reminder
    for (const reminder of dueReminders) {
      try {
        const message = reminder.messages;
        const condition = reminder.message_conditions;
        
        console.log(`Processing scheduled reminder ${reminder.id} for message ${message.id} (scheduled for ${reminder.scheduled_at})`);
        
        // Calculate time until deadline for context
        const now = new Date();
        const lastChecked = new Date(condition.last_checked);
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + (condition.hours_threshold || 0));
        deadline.setMinutes(deadline.getMinutes() + (condition.minutes_threshold || 0));
        
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
        
        // Send check-in reminder to creator
        const reminderResults = await sendCreatorReminder(
          message.id,
          condition.id,
          message.title,
          message.user_id,
          diffHours,
          reminder.scheduled_at,
          debug
        );
        
        const conditionSuccessCount = reminderResults.filter(r => r.success).length;
        
        if (conditionSuccessCount > 0) {
          successCount++;
          
          // Mark reminder as sent in the schedule
          await supabase
            .from('reminder_schedule')
            .update({ 
              status: 'sent',
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', reminder.id);
            
          console.log(`Marked reminder ${reminder.id} as sent`);
        } else {
          failedCount++;
          
          // Mark reminder as failed
          await supabase
            .from('reminder_schedule')
            .update({ 
              status: 'failed',
              last_attempt_at: new Date().toISOString(),
              retry_count: (reminder.retry_count || 0) + 1
            })
            .eq('id', reminder.id);
            
          console.log(`Marked reminder ${reminder.id} as failed`);
        }
        
        results.push({
          reminderId: reminder.id,
          messageId: message.id,
          conditionId: condition.id,
          scheduledAt: reminder.scheduled_at,
          success: conditionSuccessCount > 0,
          reminderResults: reminderResults
        });
        
      } catch (error: any) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        failedCount++;
        
        // Mark reminder as failed
        try {
          await supabase
            .from('reminder_schedule')
            .update({ 
              status: 'failed',
              last_attempt_at: new Date().toISOString(),
              retry_count: (reminder.retry_count || 0) + 1
            })
            .eq('id', reminder.id);
        } catch (updateError) {
          console.error(`Failed to update reminder ${reminder.id} status:`, updateError);
        }
        
        results.push({
          reminderId: reminder.id,
          messageId: reminder.message_id,
          conditionId: reminder.condition_id,
          scheduledAt: reminder.scheduled_at,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Scheduled reminder processing complete: ${successCount} successful, ${failedCount} failed out of ${dueReminders.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: dueReminders.length,
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
