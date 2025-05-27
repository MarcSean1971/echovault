
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendCheckInReminderToCreator } from "./send-checkin-reminder.ts";
import { sendFinalMessageToRecipients } from "./send-final-message.ts";

console.log("===== SIMPLE REMINDER PROCESSOR =====");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing simple reminders...");
    
    const supabase = supabaseClient();
    
    // Get ALL due reminders from reminder_schedule
    const { data: dueReminders, error } = await supabase
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
          user_id,
          content
        ),
        message_conditions!inner(
          id,
          recipients,
          condition_type
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error("Error fetching due reminders:", error);
      throw error;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No due reminders found",
          processedCount: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    let processedCount = 0;
    let successCount = 0;

    // Process each due reminder
    for (const reminder of dueReminders) {
      try {
        console.log(`Processing reminder ${reminder.id}, type: ${reminder.reminder_type}`);
        
        let success = false;
        
        if (reminder.reminder_type === 'reminder') {
          // Send check-in reminder to creator
          console.log(`Sending check-in reminder to creator for message ${reminder.message_id}`);
          success = await sendCheckInReminderToCreator(
            reminder.messages.user_id,
            reminder.messages.title,
            reminder.message_id
          );
        } else if (reminder.reminder_type === 'final_delivery') {
          // Send final message to recipients
          console.log(`Sending final message to recipients for message ${reminder.message_id}`);
          success = await sendFinalMessageToRecipients(
            reminder.message_conditions.recipients,
            reminder.messages.title,
            reminder.messages.content || '',
            reminder.message_id
          );
        }
        
        // Mark as processed
        const newStatus = success ? 'sent' : 'failed';
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: newStatus,
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', reminder.id);
        
        processedCount++;
        if (success) successCount++;
        
        console.log(`Reminder ${reminder.id} marked as ${newStatus}`);
        
      } catch (error: any) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('reminder_schedule')
          .update({ 
            status: 'failed',
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', reminder.id);
          
        processedCount++;
      }
    }

    console.log(`Processed ${processedCount} reminders, ${successCount} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        successCount,
        failedCount: processedCount - successCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error: any) {
    console.error("Error in simple reminder processor:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
