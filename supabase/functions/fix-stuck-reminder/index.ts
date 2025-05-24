
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabaseClient } from "../send-reminder-emails/supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("===== FIX STUCK REMINDER FUNCTION =====");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = supabaseClient();
    const now = new Date().toISOString();
    
    // STEP 1: Reset the specific failed reminder
    const failedReminderId = "91629340-219e-41c5-8911-70a72604575f";
    
    console.log(`Resetting failed reminder: ${failedReminderId}`);
    
    const { data: resetData, error: resetError } = await supabase
      .from('reminder_schedule')
      .update({
        status: 'pending',
        retry_count: 0,
        scheduled_at: now,
        last_attempt_at: null,
        updated_at: now
      })
      .eq('id', failedReminderId)
      .select();
    
    if (resetError) {
      console.error("Error resetting reminder:", resetError);
      throw resetError;
    }
    
    console.log("Reset result:", resetData);
    
    // STEP 2: Get the reminder details for processing
    const { data: reminderData, error: fetchError } = await supabase
      .from('reminder_schedule')
      .select(`
        *,
        message_conditions (
          *,
          messages (
            id,
            title,
            content,
            text_content,
            user_id
          )
        )
      `)
      .eq('id', failedReminderId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching reminder:", fetchError);
      throw fetchError;
    }
    
    console.log("Reminder data:", JSON.stringify(reminderData, null, 2));
    
    // STEP 3: Get recipients for this message
    const messageId = reminderData.message_id;
    const condition = reminderData.message_conditions;
    const recipients = condition?.recipients || [];
    
    console.log(`Processing reminder for message ${messageId} with ${recipients.length} recipients`);
    
    // STEP 4: Force send the reminder email immediately
    console.log("Forcing reminder email send...");
    
    const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-reminder-emails", {
      body: {
        messageId: messageId,
        debug: true,
        forceSend: true,
        source: "emergency-fix",
        bypassDeduplication: true,
        emergencyMode: true
      }
    });
    
    if (emailError) {
      console.error("Error forcing email send:", emailError);
      
      // Log the failure
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: failedReminderId,
        message_id: messageId,
        condition_id: condition?.id,
        recipient: 'system',
        delivery_channel: 'emergency-fix',
        delivery_status: 'failed',
        error_message: emailError.message,
        response_data: { error: emailError, source: 'emergency-fix' }
      });
      
      throw emailError;
    }
    
    console.log("Email send result:", emailResult);
    
    // STEP 5: Log the emergency fix attempt
    await supabase.from('reminder_delivery_log').insert({
      reminder_id: failedReminderId,
      message_id: messageId,
      condition_id: condition?.id,
      recipient: 'system',
      delivery_channel: 'emergency-fix',
      delivery_status: 'processing',
      response_data: { 
        emailResult,
        resetData,
        source: 'emergency-fix',
        timestamp: now
      }
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: "Emergency fix applied",
      reminderReset: resetData,
      emailResult: emailResult,
      nextSteps: "Reminder has been reset and email sending forced"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: any) {
    console.error("Error in fix-stuck-reminder function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error",
      details: error.toString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
