
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";
import { corsHeaders } from "./cors-headers.ts";

/**
 * ENHANCED: Reminder processing with final delivery handling and proper status updates
 */
serve(async (req) => {
  console.log("===== SEND REMINDER EMAILS FUNCTION =====");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Received request:", JSON.stringify(requestBody));

    const { 
      messageId, 
      debug = false, 
      forceSend = false, 
      source = "manual",
      action = "process" 
    } = requestBody;

    console.log(`Request parameters: messageId=${messageId}, debug=${debug}, forceSend=${forceSend}, source=${source}, action=${action}`);

    if (action === "process") {
      console.log("Processing check-in reminders and final deliveries...");
      
      const supabase = supabaseClient();
      
      // ENHANCED: Process both reminder and final_delivery types
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing reminders and final deliveries for creators ONLY`);
      
      // Get due reminders (both reminder and final_delivery types)
      const { data: dueReminders, error: reminderError } = await supabase
        .from('reminder_schedule')
        .select(`
          *,
          message_conditions!inner(
            id,
            message_id,
            condition_type,
            hours_threshold,
            minutes_threshold,
            last_checked
          ),
          messages!inner(
            id,
            title,
            user_id
          )
        `)
        .eq('status', 'pending')
        .in('reminder_type', ['reminder', 'final_delivery']) // ENHANCED: Include both types
        .eq('message_conditions.condition_type', 'no_check_in')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (reminderError) {
        console.error("Error fetching due reminders:", reminderError);
      } else {
        console.log(`Found ${dueReminders?.length || 0} due reminders (including final deliveries)`);
        
        if (dueReminders && dueReminders.length > 0) {
          for (const reminder of dueReminders) {
            try {
              console.log(`[PROCESSING] Processing ${reminder.reminder_type} ${reminder.id} for message ${reminder.message_id}`);
              console.log(`[PROCESSING] Creator user_id: ${reminder.messages.user_id}`);
              
              // Get creator email from profiles table
              const { data: creatorProfile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', reminder.messages.user_id)
                .single();
              
              if (!creatorProfile?.email) {
                console.error(`[PROCESSING] No email found in profiles for creator ${reminder.messages.user_id}`, profileError);
                
                // Mark as failed
                await supabase
                  .from('reminder_schedule')
                  .update({ 
                    status: 'failed',
                    last_attempt_at: new Date().toISOString(),
                    retry_count: (reminder.retry_count || 0) + 1
                  })
                  .eq('id', reminder.id);
                
                continue;
              }
              
              const creatorEmail = creatorProfile.email;
              console.log(`[PROCESSING] Got creator email from profiles: ${creatorEmail}`);
              
              // Mark as processing
              await supabase
                .from('reminder_schedule')
                .update({ 
                  status: 'processing',
                  last_attempt_at: new Date().toISOString()
                })
                .eq('id', reminder.id);
              
              // Calculate hours until deadline (or 0 for final delivery)
              const lastChecked = new Date(reminder.message_conditions.last_checked);
              const deadline = new Date(lastChecked);
              deadline.setHours(deadline.getHours() + (reminder.message_conditions.hours_threshold || 0));
              deadline.setMinutes(deadline.getMinutes() + (reminder.message_conditions.minutes_threshold || 0));
              
              const hoursUntilDeadline = reminder.reminder_type === 'final_delivery' ? 0 : 
                Math.max(0, (deadline.getTime() - Date.now()) / (1000 * 60 * 60));
              
              console.log(`[PROCESSING] Sending ${reminder.reminder_type} for message "${reminder.messages.title}" - ${hoursUntilDeadline.toFixed(1)} hours until deadline`);
              
              // Send reminder using existing service
              const reminderResults = await sendCreatorReminder(
                reminder.message_id,
                reminder.condition_id,
                reminder.messages.title,
                reminder.messages.user_id,
                hoursUntilDeadline,
                reminder.scheduled_at,
                debug
              );
              
              console.log(`[PROCESSING] Email sending completed, results:`, reminderResults);
              
              // Check if any reminders were successful
              const hasSuccess = reminderResults.some(result => result.success);
              
              if (hasSuccess) {
                // ENHANCED: Mark reminder as sent and update database
                await supabase
                  .from('reminder_schedule')
                  .update({ 
                    status: 'sent',
                    last_attempt_at: new Date().toISOString()
                  })
                  .eq('id', reminder.id);
                
                console.log(`[PROCESSING] Successfully sent ${reminder.reminder_type} ${reminder.id} to creator email ${creatorEmail}`);
                
                // ENHANCED: If this was a final delivery, update the condition's last_checked timestamp
                if (reminder.reminder_type === 'final_delivery') {
                  console.log(`[FINAL-DELIVERY] Updating last_checked timestamp for condition ${reminder.condition_id}`);
                  
                  await supabase
                    .from('message_conditions')
                    .update({ 
                      last_checked: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', reminder.condition_id);
                  
                  // ENHANCED: Emit delivery completion event for final deliveries
                  console.log(`[FINAL-DELIVERY] Emitting message-delivery-complete event for message ${reminder.message_id}`);
                  
                  // We can't emit events directly from Edge Functions, but we can trigger database changes
                  // that will be picked up by the frontend through realtime subscriptions
                  
                  // Log the completion event for potential pickup by other systems
                  await supabase.from('reminder_delivery_log').insert({
                    reminder_id: `final-delivery-${reminder.id}`,
                    message_id: reminder.message_id,
                    condition_id: reminder.condition_id,
                    recipient: creatorEmail,
                    delivery_channel: 'event',
                    delivery_status: 'completed',
                    response_data: { 
                      event_type: 'message-delivery-complete',
                      delivery_type: 'final_delivery',
                      completed_at: new Date().toISOString(),
                      source: 'send-reminder-emails'
                    }
                  });
                }
                
              } else {
                // Mark as failed
                await supabase
                  .from('reminder_schedule')
                  .update({ 
                    status: 'failed',
                    last_attempt_at: new Date().toISOString(),
                    retry_count: (reminder.retry_count || 0) + 1
                  })
                  .eq('id', reminder.id);
                
                console.error(`[PROCESSING] Failed to send ${reminder.reminder_type} ${reminder.id}:`, reminderResults);
              }
              
            } catch (reminderError) {
              console.error(`[PROCESSING] Error processing reminder ${reminder.id}:`, reminderError);
              
              // Mark as failed
              await supabase
                .from('reminder_schedule')
                .update({ 
                  status: 'failed',
                  last_attempt_at: new Date().toISOString(),
                  retry_count: (reminder.retry_count || 0) + 1
                })
                .eq('id', reminder.id);
            }
          }
        } else {
          console.log(`[${new Date().toISOString()}] [PROCESSING] No due reminders found`);
        }
      }
      
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing complete - reminders and final deliveries handled`);
      
      console.log("Processing complete: Check-in reminders and final deliveries sent to creators only");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder processing completed - check-in reminders and final deliveries to creators ONLY",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
