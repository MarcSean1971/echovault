
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { supabaseClient } from "./supabase-client.ts";
import { sendEmailNotification } from "./email/emailService.ts";
import { sendWhatsAppNotification } from "./whatsapp/whatsAppService.ts";

console.log("===== SEND MESSAGE NOTIFICATIONS FUNCTION =====");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received request:", JSON.stringify(body));
    
    const { 
      messageId, 
      conditionId,
      debug = false, 
      forceSend = false, 
      source = "manual"
    } = body;
    
    if (!messageId) {
      throw new Error("messageId is required");
    }
    
    console.log(`Processing final delivery for message ${messageId}, condition: ${conditionId}, source: ${source}`);
    
    const supabase = supabaseClient();
    
    // Get message and condition details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        message_conditions!inner(
          id,
          condition_type,
          recipients,
          active
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message}`);
    }

    const condition = conditionId 
      ? message.message_conditions.find(c => c.id === conditionId)
      : message.message_conditions.find(c => c.active);

    if (!condition) {
      throw new Error(`No active condition found for message ${messageId}`);
    }

    console.log(`Found condition ${condition.id} with ${condition.recipients?.length || 0} recipients`);

    // Check if already delivered
    const { data: existingDelivery } = await supabase
      .from('delivered_messages')
      .select('id')
      .eq('message_id', messageId)
      .eq('condition_id', condition.id)
      .limit(1);

    if (existingDelivery && existingDelivery.length > 0 && !forceSend) {
      console.log(`Message ${messageId} already delivered, skipping`);
      return new Response(
        JSON.stringify({ success: true, message: "Already delivered", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipients = condition.recipients || [];
    console.log(`Delivering to ${recipients.length} recipients`);

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        console.log(`Sending to recipient: ${recipient.email}`);
        
        // Send email notification
        const emailResult = await sendEmailNotification(
          message,
          recipient,
          condition.id
        );
        
        if (emailResult.success) {
          successCount++;
          console.log(`Email sent successfully to ${recipient.email}`);
        } else {
          failedCount++;
          console.error(`Email failed to ${recipient.email}:`, emailResult.error);
        }
        
        results.push({
          recipient: recipient.email,
          channel: 'email',
          success: emailResult.success,
          error: emailResult.error
        });

        // Send WhatsApp if phone number available
        if (recipient.phone) {
          try {
            const whatsappResult = await sendWhatsAppNotification(
              message,
              recipient,
              condition.id
            );
            
            results.push({
              recipient: recipient.phone,
              channel: 'whatsapp',
              success: whatsappResult.success,
              error: whatsappResult.error
            });
          } catch (whatsappError) {
            console.error(`WhatsApp failed to ${recipient.phone}:`, whatsappError);
            results.push({
              recipient: recipient.phone,
              channel: 'whatsapp',
              success: false,
              error: whatsappError.message
            });
          }
        }

        // Create delivery record
        await supabase.from('delivered_messages').insert({
          message_id: messageId,
          condition_id: condition.id,
          recipient_id: recipient.id,
          delivery_id: `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          delivered_at: new Date().toISOString()
        });

      } catch (recipientError) {
        console.error(`Error processing recipient ${recipient.email}:`, recipientError);
        failedCount++;
        results.push({
          recipient: recipient.email,
          channel: 'email',
          success: false,
          error: recipientError.message
        });
      }
    }

    // Disarm the condition after delivery
    await supabase
      .from('message_conditions')
      .update({ active: false })
      .eq('id', condition.id);

    console.log(`Final delivery complete: ${successCount} successful, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        conditionId: condition.id,
        successCount,
        failedCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-message-notifications:", error);
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
