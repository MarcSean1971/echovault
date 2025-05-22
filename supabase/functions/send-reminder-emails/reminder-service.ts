
import { supabaseClient } from "./supabase-client.ts";
import { ReminderData } from "./types/reminder-types.ts";
import { sendCreatorReminder, sendRecipientReminders, ReminderResult } from "./services/reminder-sender.ts";

interface ReminderProcessingResult {
  success: boolean;
  error?: string;
  sent?: boolean;
  scheduled?: boolean;
  results?: ReminderResult[];
}

/**
 * Process a single reminder
 */
export async function processReminder(
  reminder: any,
  debug: boolean = false
): Promise<ReminderProcessingResult> {
  try {
    const supabase = supabaseClient();
    
    if (debug) {
      console.log(`Processing reminder ID ${reminder.id} for message ${reminder.message_id}`);
      console.log(`Reminder type: ${reminder.reminder_type}`);
      console.log(`Scheduled for: ${reminder.scheduled_at}`);
    }
    
    // Get message and condition data
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*, user_id")
      .eq("id", reminder.message_id)
      .single();
      
    if (messageError || !messageData) {
      console.error(`Error fetching message ${reminder.message_id}:`, messageError);
      // Log the error in the delivery log
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: "system",
          delivery_channel: "system",
          channel_order: 0,
          delivery_status: 'error',
          error_message: `Message not found: ${messageError?.message || 'Unknown error'}`
        });
      } catch (logError) {
        console.error("Failed to log delivery error:", logError);
      }
      return { success: false, error: `Message not found: ${messageError?.message}` };
    }
    
    const { data: conditionData, error: conditionError } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("id", reminder.condition_id)
      .single();
      
    if (conditionError || !conditionData) {
      console.error(`Error fetching condition ${reminder.condition_id}:`, conditionError);
      // Log the error in the delivery log
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: "system",
          delivery_channel: "system",
          channel_order: 0,
          delivery_status: 'error',
          error_message: `Condition not found: ${conditionError?.message || 'Unknown error'}`
        });
      } catch (logError) {
        console.error("Failed to log delivery error:", logError);
      }
      return { success: false, error: `Condition not found: ${conditionError?.message}` };
    }
    
    // Get creator's name for personalized messages
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", messageData.user_id)
      .single();
      
    const creatorName = profileData ? 
      `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
      "Message Creator";
    
    let results: ReminderResult[] = [];
    
    // Handle different reminder types
    if (reminder.reminder_type === 'final_delivery') {
      if (debug) console.log("This is a FINAL DELIVERY reminder - treating as critical");
      
      // Track the final delivery in sent_reminders (for backward compatibility)
      try {
        await supabase.from('sent_reminders').insert({
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          user_id: messageData.user_id,
          deadline: reminder.scheduled_at,
          scheduled_for: reminder.scheduled_at
        });
      } catch (trackError) {
        console.warn("Error tracking final delivery in sent_reminders:", trackError);
        // Continue despite tracking error
      }
      
      // Log the delivery attempt in the new delivery log
      try {
        await supabase.from('reminder_delivery_log').insert({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: "multiple-recipients",
          delivery_channel: "system",
          channel_order: 0,
          delivery_status: 'processing',
          error_message: null
        });
      } catch (logError) {
        console.warn("Error logging delivery attempt:", logError);
        // Continue despite logging error
      }
      
      // For final delivery, we want to try multiple channels with fallbacks
      // This matches behavior in send-message-notifications function
      try {
        // First, try primary channel (email)
        if (conditionData.recipients && conditionData.recipients.length > 0) {
          const emailResults = await sendRecipientReminders(
            reminder.message_id,
            messageData.title,
            creatorName,
            conditionData.recipients,
            0, // Hours until deadline (it's now)
            reminder.scheduled_at,
            debug,
            true // isFinalDelivery flag
          );
          
          results = [...results, ...emailResults];
          
          // If email fails for ANY recipient, try secondary channel (WhatsApp)
          const anyEmailFailed = emailResults.some(r => !r.success);
          
          if (anyEmailFailed && debug) {
            console.log("Some email deliveries failed, will attempt secondary channel");
            
            // Secondary channel implementation would go here
            // This would call a WhatsApp delivery function
            // const whatsappResults = await sendWhatsAppFinalDelivery(...);
            // results = [...results, ...whatsappResults];
          }
        } else {
          if (debug) console.log("No recipients configured for final delivery");
          
          // Log the missing recipients error
          try {
            await supabase.from('reminder_delivery_log').insert({
              reminder_id: reminder.id,
              message_id: reminder.message_id,
              condition_id: reminder.condition_id,
              recipient: "system",
              delivery_channel: "system",
              channel_order: 0,
              delivery_status: 'error',
              error_message: "No recipients configured for final delivery"
            });
          } catch (logError) {
            console.warn("Error logging delivery error:", logError);
          }
        }
      } catch (deliveryError) {
        console.error("Error in delivery channels for final delivery:", deliveryError);
        
        // Log the delivery error
        try {
          await supabase.from('reminder_delivery_log').insert({
            reminder_id: reminder.id,
            message_id: reminder.message_id,
            condition_id: reminder.condition_id,
            recipient: "system",
            delivery_channel: "system", 
            channel_order: 0,
            delivery_status: 'error',
            error_message: `Delivery channel error: ${deliveryError.message || 'Unknown error'}`
          });
        } catch (logError) {
          console.warn("Error logging delivery error:", logError);
        }
      }
      
      // Record the final delivery status
      try {
        const allSuccessful = results.length > 0 && results.every(r => r.success);
        
        // Update the condition to inactive unless it's a recurring check-in or has keep_armed
        if (conditionData.condition_type !== 'recurring_check_in') {
          // For panic buttons, check keep_armed setting
          let keepArmed = false;
          
          if (conditionData.condition_type === 'panic_trigger' && conditionData.panic_config) {
            keepArmed = conditionData.panic_config.keep_armed === true;
          }
          
          if (!keepArmed) {
            await supabase
              .from('message_conditions')
              .update({ active: false })
              .eq('id', reminder.condition_id);
              
            if (debug) console.log(`Deactivated condition ${reminder.condition_id} after final delivery`);
          } else {
            if (debug) console.log(`Keeping condition ${reminder.condition_id} active (keep_armed=true)`);
          }
        }
      } catch (statusError) {
        console.error("Error updating condition status after final delivery:", statusError);
      }
    } else {
      // This is a regular reminder, not final delivery
      if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(conditionData.condition_type)) {
        // FIXED: Calculate the actual time until deadline instead of hardcoded 48 hours
        // Calculate hours until deadline based on the condition's threshold and last check-in
        let hoursUntilDeadline = 0;
        
        if (conditionData.last_checked) {
          const lastCheckedDate = new Date(conditionData.last_checked);
          const hoursThreshold = conditionData.hours_threshold || 0;
          const minutesThreshold = conditionData.minutes_threshold || 0;
          
          // Calculate virtual deadline
          const virtualDeadline = new Date(lastCheckedDate);
          virtualDeadline.setHours(virtualDeadline.getHours() + hoursThreshold);
          virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesThreshold);
          
          // Calculate hours until that deadline
          const now = new Date();
          hoursUntilDeadline = (virtualDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (debug) {
            console.log(`Calculated ${hoursUntilDeadline.toFixed(2)} hours until deadline`);
            console.log(`Last checked: ${lastCheckedDate.toISOString()}`);
            console.log(`Hours threshold: ${hoursThreshold}, Minutes threshold: ${minutesThreshold}`);
            console.log(`Virtual deadline: ${virtualDeadline.toISOString()}`);
          }
        } else {
          console.warn(`No last_checked date for condition ${conditionData.id}, using default hours`);
          hoursUntilDeadline = conditionData.hours_threshold || 48; // Fallback
        }
        
        // For check-in conditions, send reminder to creator
        results = await sendCreatorReminder(
          reminder.message_id,
          reminder.condition_id,
          messageData.title,
          messageData.user_id,
          hoursUntilDeadline, // Use calculated time instead of hardcoded value
          reminder.scheduled_at,
          debug
        );
      } else {
        // For standard deadlines, remind recipients
        if (conditionData.recipients && conditionData.recipients.length > 0) {
          // Calculate hours until deadline
          const deadlineDate = new Date(conditionData.trigger_date || reminder.scheduled_at);
          const now = new Date();
          const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          results = await sendRecipientReminders(
            reminder.message_id,
            messageData.title,
            creatorName,
            conditionData.recipients,
            hoursUntilDeadline,
            reminder.scheduled_at,
            debug,
            false // Not final delivery
          );
        } else {
          if (debug) console.log("No recipients configured for reminder");
          
          // Log the missing recipients error
          try {
            await supabase.from('reminder_delivery_log').insert({
              reminder_id: reminder.id,
              message_id: reminder.message_id,
              condition_id: reminder.condition_id,
              recipient: "system",
              delivery_channel: "system",
              channel_order: 0,
              delivery_status: 'error',
              error_message: "No recipients configured for reminder"
            });
          } catch (logError) {
            console.warn("Error logging delivery error:", logError);
          }
        }
      }
      
      // Track the reminder in sent_reminders (for backward compatibility)
      try {
        await supabase.from('sent_reminders').insert({
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          user_id: messageData.user_id,
          deadline: conditionData.trigger_date || reminder.scheduled_at,
          scheduled_for: reminder.scheduled_at
        });
      } catch (trackError) {
        console.warn("Error tracking reminder in sent_reminders:", trackError);
        // Continue despite tracking error
      }
    }
    
    // Determine overall success
    const anySuccess = results.some(r => r.success);
    const allFailed = results.length > 0 && results.every(r => !r.success);
    
    // Update the delivery log with final status
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: reminder.id,
        message_id: reminder.message_id,
        condition_id: reminder.condition_id,
        recipient: "summary",
        delivery_channel: "summary",
        channel_order: 999,
        delivery_status: anySuccess ? 'delivered' : 'failed',
        error_message: allFailed ? "All reminder deliveries failed" : null,
        response_data: { results: results }
      });
    } catch (logError) {
      console.warn("Error logging final delivery status:", logError);
    }
    
    if (debug) {
      console.log(`Reminder processing complete with ${results.filter(r => r.success).length}/${results.length} successful deliveries`);
    }
    
    return { 
      success: anySuccess, 
      sent: anySuccess,
      error: allFailed ? "All reminder deliveries failed" : undefined,
      results: results
    };
  } catch (error: any) {
    console.error(`Error in processReminder:`, error);
    
    // Log the error in the delivery log
    try {
      const supabase = supabaseClient();
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: "unknown", // We may not have the reminder id in case of error
        message_id: "unknown",
        condition_id: "unknown",
        recipient: "system",
        delivery_channel: "system",
        channel_order: 0,
        delivery_status: 'error',
        error_message: `System error: ${error.message || 'Unknown error in processReminder'}`
      });
    } catch (logError) {
      console.error("Failed to log delivery error:", logError);
    }
    
    return { 
      success: false, 
      error: error.message || "Unknown error in processReminder" 
    };
  }
}

