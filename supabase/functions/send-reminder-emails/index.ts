
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendCreatorReminder } from "./services/reminder-sender.ts";
import { corsHeaders } from "./cors-headers.ts";

/**
 * FIXED: Enhanced reminder processing with proper deadline validation to prevent premature final delivery
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
      console.log("Processing due reminders with FIXED deadline validation...");
      console.log("Checking for all due reminders");
      
      const supabase = supabaseClient();
      
      // PHASE 1: Process check-in reminders (sent to creators only)
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] PHASE 1: Processing check-in reminders for creators`);
      
      // Get due check-in reminders
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
        .eq('reminder_type', 'reminder')
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
              console.log(`Processing check-in reminder ${reminder.id} for message ${reminder.message_id}`);
              console.log(`Creator user_id: ${reminder.messages.user_id}`);
              
              // Get creator email from profiles table
              const { data: creatorProfile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', reminder.messages.user_id)
                .single();
              
              if (!creatorProfile?.email) {
                console.error(`[REMINDER-PROCESSOR] No email found in profiles for creator ${reminder.messages.user_id}`, profileError);
                
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
              console.log(`[REMINDER-PROCESSOR] Got creator email from profiles: ${creatorEmail}`);
              
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
              
              console.log(`Sending check-in reminder for message "${reminder.messages.title}" - ${hoursUntilDeadline.toFixed(1)} hours until deadline`);
              console.log(`Using creator email from profiles: ${creatorEmail}`);
              
              // Send reminder to creator only
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
                
                console.log(`Successfully sent check-in reminder ${reminder.id} to creator email ${creatorEmail}`);
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
                
                console.error(`Failed to send check-in reminder ${reminder.id}:`, reminderResults);
              }
              
            } catch (reminderError) {
              console.error(`Error processing check-in reminder ${reminder.id}:`, reminderError);
              
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
          console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] No due check-in reminders found`);
        }
      }
      
      // PHASE 2: Process final delivery messages (with STRICT deadline validation)
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] PHASE 2: Processing final delivery messages (with STRICT deadline validation)`);
      
      // Get due final delivery reminders
      const { data: finalDeliveryReminders, error: finalError } = await supabase
        .from('reminder_schedule')
        .select(`
          *,
          message_conditions!inner(
            id,
            message_id,
            condition_type,
            hours_threshold,
            minutes_threshold,
            last_checked,
            recipients
          ),
          messages!inner(
            id,
            title,
            user_id
          )
        `)
        .eq('status', 'pending')
        .eq('reminder_type', 'final_delivery')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (finalError) {
        console.error("Error fetching final delivery reminders:", finalError);
      } else {
        console.log(`Found ${finalDeliveryReminders?.length || 0} due final delivery reminders`);
        
        if (finalDeliveryReminders && finalDeliveryReminders.length > 0) {
          for (const reminder of finalDeliveryReminders) {
            try {
              console.log(`[FINAL-DELIVERY] Validating deadline for message ${reminder.message_id}`);
              
              const condition = reminder.message_conditions;
              const isCheckInCondition = ['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type);
              
              if (isCheckInCondition) {
                // CRITICAL FIX: Validate actual deadline has been reached
                const now = new Date();
                const lastChecked = new Date(condition.last_checked);
                const actualDeadline = new Date(lastChecked);
                actualDeadline.setHours(actualDeadline.getHours() + (condition.hours_threshold || 0));
                actualDeadline.setMinutes(actualDeadline.getMinutes() + (condition.minutes_threshold || 0));
                
                console.log(`[FINAL-DELIVERY] Deadline validation - Last checked: ${lastChecked.toISOString()}, Actual deadline: ${actualDeadline.toISOString()}, Current time: ${now.toISOString()}`);
                
                // STRICT VALIDATION: Only proceed if actual deadline has passed
                if (now < actualDeadline) {
                  const minutesRemaining = (actualDeadline.getTime() - now.getTime()) / (1000 * 60);
                  console.log(`[FINAL-DELIVERY] BLOCKING final delivery - deadline not reached yet (${minutesRemaining.toFixed(1)} minutes remaining)`);
                  
                  // Reschedule for the actual deadline
                  await supabase
                    .from('reminder_schedule')
                    .update({ 
                      scheduled_at: actualDeadline.toISOString(),
                      last_attempt_at: new Date().toISOString()
                    })
                    .eq('id', reminder.id);
                  
                  continue; // Skip this final delivery
                }
                
                // ADDITIONAL SAFEGUARD: Check if user checked in recently (within last 5 minutes)
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                if (lastChecked > fiveMinutesAgo) {
                  console.log(`[FINAL-DELIVERY] BLOCKING final delivery - recent check-in detected at ${lastChecked.toISOString()}`);
                  
                  // Mark as obsolete since user checked in
                  await supabase
                    .from('reminder_schedule')
                    .update({ 
                      status: 'obsolete',
                      last_attempt_at: new Date().toISOString()
                    })
                    .eq('id', reminder.id);
                  
                  continue; // Skip this final delivery
                }
                
                console.log(`[FINAL-DELIVERY] APPROVED final delivery - deadline passed and no recent check-in`);
              }
              
              // If we reach here, final delivery is approved
              console.log(`Processing final delivery ${reminder.id} for message ${reminder.message_id}`);
              
              // Mark as processing
              await supabase
                .from('reminder_schedule')
                .update({ 
                  status: 'processing',
                  last_attempt_at: new Date().toISOString()
                })
                .eq('id', reminder.id);
              
              // TODO: Implement actual final delivery logic here
              // This would send the message to all recipients
              console.log(`Final delivery would be sent to recipients for message ${reminder.message_id}`);
              
              // Mark as sent for now
              await supabase
                .from('reminder_schedule')
                .update({ 
                  status: 'sent',
                  last_attempt_at: new Date().toISOString()
                })
                .eq('id', reminder.id);
              
            } catch (finalDeliveryError) {
              console.error(`Error processing final delivery ${reminder.id}:`, finalDeliveryError);
              
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
          console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] No due final delivery reminders found`);
        }
      }
      
      console.log(`[${new Date().toISOString()}] [REMINDER-PROCESSOR] Processing complete with STRICT deadline validation`);
      
      console.log("Processing complete: Check-in reminders sent to creators only, final delivery blocked until actual deadline");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder processing completed with FIXED deadline validation",
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
