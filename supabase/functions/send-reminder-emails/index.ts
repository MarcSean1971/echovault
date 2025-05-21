
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
      action,
      testMode = false,
      source = 'api-call',
      userId,
    } = params;

    console.log(`Request received:`, params);

    // Initialize Supabase client
    const supabase = supabaseClient();

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
    
    // Get pending reminders that are due
    const { data: dueReminders, error } = await supabase.rpc('acquire_due_reminders', {
      max_reminders: 20,
      message_filter: messageId || null,
    });

    if (error) {
      throw error;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    // Process each due reminder
    const results = [];
    for (const reminder of dueReminders || []) {
      try {
        const result = await processReminder(reminder, debug);
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
