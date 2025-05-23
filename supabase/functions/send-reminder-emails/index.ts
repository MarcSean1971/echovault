
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "./cors-headers.ts";
import { supabaseClient } from "./supabase-client.ts";
import { processReminder } from "./reminder-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    let params: any = {};
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        params = body || {};
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        params = {};
      }
    }

    const {
      debug = false,
      forceSend = false,
      messageId,
      action = "process",
      testMode = false,
      source = 'api-call',
      userId,
    } = params;

    console.log(`Request received:`, params);
    console.log(`Request action: ${action}, forceSend: ${forceSend}, source: ${source}`);

    // Initialize Supabase client
    const supabase = supabaseClient();
    
    // CRITICAL FIX: Handle special actions
    if (action === "update-after-checkin" && messageId) {
      console.log(`Processing update-after-checkin action for message ${messageId}`);
      
      // Get the message condition
      const { data: condition, error: conditionError } = await supabase
        .from('message_conditions')
        .select('*')
        .eq('message_id', messageId)
        .single();
        
      if (conditionError || !condition) {
        throw new Error(`Error fetching condition: ${conditionError?.message || "Condition not found"}`);
      }
      
      // Mark existing reminders as obsolete
      await supabase
        .from('reminder_schedule')
        .update({ status: 'obsolete' })
        .eq('message_id', messageId)
        .eq('status', 'pending');
        
      console.log(`Marked pending reminders as obsolete for message ${messageId} after check-in`);
      
      // Create new reminder schedule based on updated check-in time
      // Actual reminder schedule creation will happen through the frontend
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Updated reminder schedule after check-in",
          action: "update-after-checkin",
          messageId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For test delivery action, handle a single test reminder
    if (action === 'test-delivery') {
      console.log('Processing TEST DELIVERY request');
      
      if (!messageId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing messageId parameter for test delivery',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Create a test reminder from the message
      try {
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .select('*, user_id')
          .eq('id', messageId)
          .single();

        if (messageError || !message) {
          throw new Error(`Message not found: ${messageError?.message || 'Unknown error'}`);
        }

        // Verify message has a condition
        const { data: condition, error: conditionError } = await supabase
          .from('message_conditions')
          .select('*')
          .eq('message_id', messageId)
          .maybeSingle();

        if (conditionError) {
          throw new Error(`Error fetching condition: ${conditionError.message}`);
        }

        const conditionId = condition?.id || 'test-condition';

        // Create a manual reminder record - this will be processed immediately due to forceSend
        const testReminderId = `test-${Date.now()}`;
        
        const { error: insertError } = await supabase
          .from('reminder_schedule')
          .insert({
            id: testReminderId,
            message_id: messageId,
            condition_id: conditionId,
            scheduled_at: new Date().toISOString(),
            status: 'processing', // Mark as processing immediately
            reminder_type: condition?.condition_type === 'no_check_in' ? 'check_in' : 'test',
            delivery_priority: 'high'
          });

        if (insertError) {
          throw new Error(`Error creating test reminder: ${insertError.message}`);
        }

        // Process this reminder immediately
        const result = await processReminder(
          {
            id: testReminderId,
            message_id: messageId,
            condition_id: conditionId,
            scheduled_at: new Date().toISOString(),
            status: 'processing',
            reminder_type: condition?.condition_type === 'no_check_in' ? 'check_in' : 'test',
            delivery_priority: 'high'
          },
          true // debug mode enabled for tests
        );

        // Update reminder status based on result
        await supabase
          .from('reminder_schedule')
          .update({
            status: result.success ? 'sent' : 'failed',
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', testReminderId);

        return new Response(
          JSON.stringify({
            success: result.success,
            result,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error processing test delivery:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message || 'Unknown error processing test delivery',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Handle normal reminder processing
    console.log('Checking for due reminders...');
    
    // CRITICAL FIX: If forceSend is true, modify the query to include "processing" status reminders
    const maxReminders = 20;
    
    // Define the query parameters 
    const queryParams: any = {
      max_reminders: maxReminders,
      message_filter: messageId || null,
    };
    
    // Use different query based on forceSend flag
    const queryName = forceSend ? 'acquire_all_reminders' : 'acquire_due_reminders';
    
    // Get pending reminders that are due or forceSend is true
    const { data: dueReminders, error } = await supabase.rpc(queryName, queryParams);

    if (error) {
      console.error(`Error fetching reminders:`, error);
      
      // Try a direct query if the RPC function failed
      let fallbackQuery;
      
      if (forceSend && messageId) {
        // If forceSend is true and messageId is provided, get all reminders for that message
        fallbackQuery = supabase
          .from('reminder_schedule')
          .select('*')
          .eq('message_id', messageId)
          .in('status', ['pending', 'processing'])
          .order('scheduled_at')
          .limit(maxReminders);
      } else if (messageId) {
        // If only messageId is provided, get due reminders for that message
        fallbackQuery = supabase
          .from('reminder_schedule')
          .select('*')
          .eq('message_id', messageId)
          .eq('status', 'pending')
          .lte('scheduled_at', new Date().toISOString())
          .order('scheduled_at')
          .limit(maxReminders);
      } else {
        // Default query for all due reminders
        fallbackQuery = supabase
          .from('reminder_schedule')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_at', new Date().toISOString())
          .order('scheduled_at')
          .limit(maxReminders);
      }
      
      const { data: fallbackReminders, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        throw fallbackError;
      }
      
      console.log(`Using fallback query - found ${fallbackReminders?.length || 0} reminders`);
      
      // Use fallback reminders if available
      if (fallbackReminders) {
        // Update status to processing for the reminders
        for (const reminder of fallbackReminders) {
          await supabase
            .from('reminder_schedule')
            .update({ status: 'processing', last_attempt_at: new Date().toISOString() })
            .eq('id', reminder.id);
        }
        
        // Process the reminders
        return await processReminders(fallbackReminders, forceSend, debug, supabase, corsHeaders);
      }
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);
    
    if (!dueReminders || dueReminders.length === 0) {
      // If forceSend and messageId are provided, try to create a reminder for immediate delivery
      if (forceSend && messageId) {
        console.log(`No reminders found but forceSend=true, creating immediate reminder for ${messageId}`);
        
        // Get the message condition to determine condition_id and type
        const { data: condition, error: conditionError } = await supabase
          .from('message_conditions')
          .select('id, condition_type')
          .eq('message_id', messageId)
          .single();
          
        if (conditionError || !condition) {
          console.error(`Couldn't find condition for message ${messageId}:`, conditionError);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "No active conditions found for message",
              forceSend: forceSend,
              messageId: messageId
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        // Create an immediate reminder for this message
        const immediateReminder = {
          id: `immediate-${Date.now()}`,
          message_id: messageId,
          condition_id: condition.id,
          scheduled_at: new Date().toISOString(),
          status: 'processing',
          reminder_type: condition.condition_type === 'no_check_in' ? 'check_in' : 'immediate',
          delivery_priority: 'critical'
        };
        
        // Insert this reminder
        await supabase
          .from('reminder_schedule')
          .insert(immediateReminder);
          
        console.log(`Created immediate reminder for message ${messageId}`);
        
        // Process this single reminder directly
        const result = await processReminder(immediateReminder, debug);
        
        // Update reminder status
        await supabase
          .from('reminder_schedule')
          .update({
            status: result.success ? 'sent' : 'failed',
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', immediateReminder.id);
        
        return new Response(
          JSON.stringify({
            success: result.success,
            processedCount: 1,
            results: [result],
            immediateCreated: true
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, processedCount: 0, results: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return await processReminders(dueReminders, forceSend, debug, supabase, corsHeaders);
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error in edge function',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to process reminders
async function processReminders(reminders: any[], forceSend: boolean, debug: boolean, supabase: any, corsHeaders: any) {
  // Process each due reminder
  const results = [];
  for (const reminder of reminders || []) {
    try {
      console.log(`Processing reminder ${reminder.id} for message ${reminder.message_id}`);
      
      // CRITICAL FIX: Add forceSend flag to processReminder
      const result = await processReminder(reminder, debug, forceSend);
      results.push({
        reminderId: reminder.id,
        messageId: reminder.message_id,
        success: result.success,
        error: result.error,
      });
      
      // Update reminder status
      await supabase
        .from('reminder_schedule')
        .update({
          status: result.success ? 'sent' : 'failed',
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', reminder.id);
    } catch (processError) {
      console.error(`Error processing reminder ${reminder.id}:`, processError);
      results.push({
        reminderId: reminder.id,
        messageId: reminder.message_id,
        success: false,
        error: processError.message || 'Unknown error processing reminder',
      });
      
      // Mark as failed
      await supabase
        .from('reminder_schedule')
        .update({
          status: 'failed',
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', reminder.id);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      processedCount: results.length,
      results,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
