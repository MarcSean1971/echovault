

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";
import { corsHeaders } from "./cors-headers.ts";

/**
 * SIMPLIFIED: Enhanced reminder processing with ONLY check-in reminders sent to creators
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
      console.log("Processing ONLY check-in reminders sent to creators...");
      console.log("Checking for check-in reminders due");
      
      const supabase = supabaseClient();
      
      // SIMPLIFIED: Process ONLY check-in reminders (sent to creators ONLY)
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing check-in reminders for creators ONLY`);
      
      // Get due check-in reminders - STRICTLY for creators only
      const { data: checkInReminders, error: checkInError } = await supabase
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
        .eq('reminder_type', 'reminder') // CRITICAL: Only reminder type, NOT final_delivery
        .eq('message_conditions.condition_type', 'no_check_in')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (checkInError) {
        console.error("Error fetching check-in reminders:", checkInError);
      } else {
        console.log(`Found ${checkInReminders?.length || 0} due check-in reminders`);
        
        if (checkInReminders && checkInReminders.length > 0) {
          for (const reminder of checkInReminders) {
            try {
              console.log(`[CHECK-IN-ONLY] Processing check-in reminder ${reminder.id} for message ${reminder.message_id}`);
              console.log(`[CHECK-IN-ONLY] Creator user_id: ${reminder.messages.user_id}`);
              console.log(`[CHECK-IN-ONLY] CRITICAL: This will ONLY send to creator, NO recipients`);
              
              // Get creator email from profiles table
              const { data: creatorProfile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', reminder.messages.user_id)
                .single();
              
              if (!creatorProfile?.email) {
                console.error(`[CHECK-IN-ONLY] No email found in profiles for creator ${reminder.messages.user_id}`, profileError);
                
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
              console.log(`[CHECK-IN-ONLY] Got creator email from profiles: ${creatorEmail}`);
              
              // Mark as processing
              await supabase
                .from('reminder_schedule')
                .update({ 
                  status: 'processing',
                  last_attempt_at: new Date().toISOString()
                })
                .eq('id', reminder.id);
              
              // Calculate hours until deadline
              const lastChecked = new Date(reminder.message_conditions.last_checked);
              const deadline = new Date(lastChecked);
              deadline.setHours(deadline.getHours() + (reminder.message_conditions.hours_threshold || 0));
              deadline.setMinutes(deadline.getMinutes() + (reminder.message_conditions.minutes_threshold || 0));
              
              const hoursUntilDeadline = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
              
              console.log(`[CHECK-IN-ONLY] Sending check-in reminder for message "${reminder.messages.title}" - ${hoursUntilDeadline.toFixed(1)} hours until deadline`);
              console.log(`[CHECK-IN-ONLY] Using creator email from profiles: ${creatorEmail}`);
              console.log(`[CHECK-IN-ONLY] CONFIRMED: Calling sendCreatorReminder() ONLY - NO recipient emails`);
              
              // CRITICAL FIX: ONLY call sendCreatorReminder, NEVER sendRecipientReminders
              const reminderResults = await sendCreatorReminder(
                reminder.message_id,
                reminder.condition_id,
                reminder.messages.title,
                reminder.messages.user_id,
                creatorEmail,
                hoursUntilDeadline,
                reminder.scheduled_at,
                debug
              );
              
              console.log(`[CHECK-IN-ONLY] sendCreatorReminder() completed, results:`, reminderResults);
              
              // Check if any reminders were successful
              const hasSuccess = reminderResults.some(result => result.success);
              
              if (hasSuccess) {
                // Mark as sent
                await supabase
                  .from('reminder_schedule')
                  .update({ 
                    status: 'sent',
                    last_attempt_at: new Date().toISOString()
                  })
                  .eq('id', reminder.id);
                
                console.log(`[CHECK-IN-ONLY] Successfully sent check-in reminder ${reminder.id} to creator email ${creatorEmail} ONLY`);
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
                
                console.error(`[CHECK-IN-ONLY] Failed to send check-in reminder ${reminder.id}:`, reminderResults);
              }
              
            } catch (reminderError) {
              console.error(`[CHECK-IN-ONLY] Error processing check-in reminder ${reminder.id}:`, reminderError);
              
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
          console.log(`[${new Date().toISOString()}] [CHECK-IN-ONLY] No due check-in reminders found`);
        }
      }
      
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing complete - check-in reminders to creators ONLY`);
      
      console.log("Processing complete: Check-in reminders sent to creators only");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder processing completed - check-in reminders to creators ONLY",
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

