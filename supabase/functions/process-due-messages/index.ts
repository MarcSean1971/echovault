
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("===== PROCESS DUE MESSAGES FUNCTION =====");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Checking for due messages...");

    // Find all active conditions that are past their deadline
    const now = new Date();
    const { data: dueConditions, error: conditionsError } = await supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        condition_type,
        trigger_date,
        last_checked,
        hours_threshold,
        minutes_threshold,
        messages(
          id,
          title,
          content,
          text_content,
          user_id
        )
      `)
      .eq('active', true)
      .not('messages', 'is', null);

    if (conditionsError) {
      console.error("Error fetching conditions:", conditionsError);
      throw conditionsError;
    }

    console.log(`Found ${dueConditions?.length || 0} active conditions to check`);

    let processedCount = 0;
    let deliveredCount = 0;

    for (const condition of dueConditions || []) {
      try {
        let isDue = false;
        let deadlineText = "";

        if (condition.condition_type === 'scheduled' && condition.trigger_date) {
          const deadline = new Date(condition.trigger_date);
          isDue = now >= deadline;
          deadlineText = `scheduled for ${deadline.toISOString()}`;
        } else if (['no_check_in', 'regular_check_in'].includes(condition.condition_type)) {
          if (condition.last_checked && condition.hours_threshold) {
            const deadline = new Date(condition.last_checked);
            deadline.setHours(deadline.getHours() + condition.hours_threshold);
            if (condition.minutes_threshold) {
              deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
            }
            isDue = now >= deadline;
            deadlineText = `check-in deadline ${deadline.toISOString()}`;
          }
        }

        if (isDue) {
          console.log(`Message ${condition.message_id} is due! Condition: ${condition.condition_type}, ${deadlineText}`);
          
          // Check if this message has already been delivered
          const { data: existingDelivery } = await supabase
            .from('delivered_messages')
            .select('id')
            .eq('message_id', condition.message_id)
            .eq('condition_id', condition.id)
            .limit(1);

          if (existingDelivery && existingDelivery.length > 0) {
            console.log(`Message ${condition.message_id} already delivered, skipping`);
            continue;
          }

          // Get recipients for this condition
          const recipients = condition.recipients || [];
          console.log(`Delivering to ${recipients.length} recipients`);

          // Trigger the message delivery
          const deliveryResult = await supabase.functions.invoke('send-message-notifications', {
            body: {
              messageId: condition.message_id,
              conditionId: condition.id,
              forceSend: true,
              source: 'cron-final-delivery',
              debug: true
            }
          });

          if (deliveryResult.error) {
            console.error(`Error triggering delivery for message ${condition.message_id}:`, deliveryResult.error);
          } else {
            console.log(`Successfully triggered delivery for message ${condition.message_id}`);
            deliveredCount++;

            // Disarm the condition after successful delivery
            await supabase
              .from('message_conditions')
              .update({ active: false })
              .eq('id', condition.id);
          }
        }

        processedCount++;
      } catch (conditionError) {
        console.error(`Error processing condition ${condition.id}:`, conditionError);
      }
    }

    const result = {
      success: true,
      processedCount,
      deliveredCount,
      timestamp: now.toISOString()
    };

    console.log("Processing complete:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Error in process-due-messages function:", error);
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
