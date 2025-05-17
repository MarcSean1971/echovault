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
      return { success: false, error: `Message not found: ${messageError?.message}` };
    }
    
    const { data: conditionData, error: conditionError } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("id", reminder.condition_id)
      .single();
      
    if (conditionError || !conditionData) {
      console.error(`Error fetching condition ${reminder.condition_id}:`, conditionError);
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
        }
      } catch (deliveryError) {
        console.error("Error in delivery channels for final delivery:", deliveryError);
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
        // For check-in conditions, send reminder to creator
        results = await sendCreatorReminder(
          reminder.message_id,
          reminder.condition_id,
          messageData.title,
          messageData.user_id,
          48, // Default hours until deadline
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
    return { 
      success: false, 
      error: error.message || "Unknown error in processReminder" 
    };
  }
}
