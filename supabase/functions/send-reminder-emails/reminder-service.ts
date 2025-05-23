
import { supabaseClient } from "./supabase-client.ts";
import { ReminderData, ReminderProcessingResult } from "./types/reminder-types.ts";
import { sendCreatorReminder, sendRecipientReminders, ReminderResult } from "./services/reminder-sender.ts";
import { 
  fetchMessageData, 
  fetchConditionData, 
  fetchCreatorProfile, 
  getCreatorName, 
  logDeliveryError, 
  shouldKeepConditionActive 
} from "./services/data-fetcher.ts";
import { 
  updateConditionStatus, 
  trackInSentReminders, 
  logDeliveryAttempt, 
  logFinalDeliveryStatus 
} from "./services/condition-manager.ts";
import { sendWhatsApp, getAppUrl, formatTimeUntilDeadline } from "./services/whatsapp-service.ts";

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
    let messageData, conditionData;
    try {
      messageData = await fetchMessageData(reminder.message_id);
    } catch (messageError) {
      console.error(`Error fetching message ${reminder.message_id}:`, messageError);
      
      // Log the error in the delivery log
      await logDeliveryError({
        reminder_id: reminder.id,
        message_id: reminder.message_id,
        condition_id: reminder.condition_id,
        recipient: "system",
        delivery_channel: "system",
        channel_order: 0,
        delivery_status: 'error',
        error_message: `Message not found: ${messageError.message || 'Unknown error'}`
      });
      
      return { success: false, error: `Message not found: ${messageError.message}` };
    }
    
    try {
      conditionData = await fetchConditionData(reminder.condition_id);
    } catch (conditionError) {
      console.error(`Error fetching condition ${reminder.condition_id}:`, conditionError);
      
      // Log the error in the delivery log
      await logDeliveryError({
        reminder_id: reminder.id,
        message_id: reminder.message_id,
        condition_id: reminder.condition_id,
        recipient: "system",
        delivery_channel: "system",
        channel_order: 0,
        delivery_status: 'error',
        error_message: `Condition not found: ${conditionError.message || 'Unknown error'}`
      });
      
      return { success: false, error: `Condition not found: ${conditionError.message}` };
    }
    
    // Get creator's name for personalized messages
    const profileData = await fetchCreatorProfile(messageData.user_id);
    const creatorName = getCreatorName(profileData);
    
    let results: ReminderResult[] = [];
    
    // Handle different reminder types
    if (reminder.reminder_type === 'final_delivery') {
      if (debug) console.log("This is a FINAL DELIVERY reminder - treating as critical");
      
      // Track the final delivery in sent_reminders (for backward compatibility)
      try {
        await trackInSentReminders(
          reminder.message_id,
          reminder.condition_id,
          messageData.user_id,
          reminder.scheduled_at
        );
      } catch (trackError) {
        // Non-fatal error, continue
        console.warn("Error tracking final delivery in sent_reminders:", trackError);
      }
      
      // Log the delivery attempt
      await logDeliveryAttempt(reminder.id, reminder.message_id, reminder.condition_id, true);
      
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
            
            // Implement WhatsApp as secondary channel
            try {
              // Get app URL for the template
              const appUrl = await getAppUrl();
              
              // Send WhatsApp message to each recipient who has a phone number
              for (const recipient of conditionData.recipients) {
                if (recipient.phone) {
                  console.log(`Sending WhatsApp final delivery to ${recipient.name} at ${recipient.phone}`);
                  
                  const whatsAppResult = await sendWhatsApp(
                    recipient,
                    messageData,
                    {
                      timeUntilDeadline: "now", // Final delivery is happening now
                      appUrl,
                      debug
                    }
                  );
                  
                  results.push({
                    success: whatsAppResult.success,
                    recipient: recipient.name,
                    channel: 'whatsapp',
                    messageId: whatsAppResult.messageId,
                    error: whatsAppResult.error
                  });
                }
              }
            } catch (whatsAppError) {
              console.error("Error sending WhatsApp notifications:", whatsAppError);
            }
          }
        } else {
          if (debug) console.log("No recipients configured for final delivery");
          
          // Log the missing recipients error
          await logDeliveryError({
            reminder_id: reminder.id,
            message_id: reminder.message_id,
            condition_id: reminder.condition_id,
            recipient: "system",
            delivery_channel: "system",
            channel_order: 0,
            delivery_status: 'error',
            error_message: "No recipients configured for final delivery"
          });
        }
      } catch (deliveryError) {
        console.error("Error in delivery channels for final delivery:", deliveryError);
        
        // Log the delivery error
        await logDeliveryError({
          reminder_id: reminder.id,
          message_id: reminder.message_id,
          condition_id: reminder.condition_id,
          recipient: "system",
          delivery_channel: "system", 
          channel_order: 0,
          delivery_status: 'error',
          error_message: `Delivery channel error: ${deliveryError.message || 'Unknown error'}`
        });
      }
      
      // Record the final delivery status
      try {
        const allSuccessful = results.length > 0 && results.every(r => r.success);
        
        // Update the condition to inactive unless it's a recurring check-in or has keep_armed
        const keepActive = shouldKeepConditionActive(conditionData);
        await updateConditionStatus(reminder.condition_id, keepActive, debug);
      } catch (statusError) {
        console.error("Error updating condition status after final delivery:", statusError);
      }
    } else {
      // This is a regular reminder, not final delivery
      if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(conditionData.condition_type)) {
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
        
        // CRITICAL FIX: For check-in conditions, send reminder to creator only
        // Pass proper parameters to the sendCreatorReminder function
        const emailResults = await sendCreatorReminder(
          reminder.message_id,
          reminder.condition_id,
          messageData.title,
          messageData.user_id, // This must be the user_id for the creator
          hoursUntilDeadline,
          reminder.scheduled_at,
          debug
        );
        
        results = [...results, ...emailResults];
        
        // Additionally, try to send WhatsApp reminder to creator if they have a phone number
        try {
          if (profileData && profileData.whatsapp_number) {
            console.log(`Sending WhatsApp check-in reminder to creator at ${profileData.whatsapp_number}`);
            
            // Format deadline in human-readable format
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + hoursUntilDeadline);
            const timeUntilDeadline = formatTimeUntilDeadline(deadline);
            
            // Get app URL for the template
            const appUrl = await getAppUrl();
            
            // Create a recipient object from profile data
            const recipient = {
              name: profileData.first_name + " " + profileData.last_name,
              firstName: profileData.first_name,
              phone: profileData.whatsapp_number
            };
            
            const whatsAppResult = await sendWhatsApp(
              recipient,
              messageData,
              {
                timeUntilDeadline,
                appUrl,
                debug
              }
            );
            
            results.push({
              success: whatsAppResult.success,
              recipient: recipient.name,
              channel: 'whatsapp',
              messageId: whatsAppResult.messageId,
              error: whatsAppResult.error
            });
          } else if (debug) {
            console.log("No WhatsApp number found for creator, skipping WhatsApp reminder");
          }
        } catch (whatsAppError) {
          console.error("Error sending WhatsApp reminder to creator:", whatsAppError);
        }
        
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
          await logDeliveryError({
            reminder_id: reminder.id,
            message_id: reminder.message_id,
            condition_id: reminder.condition_id,
            recipient: "system",
            delivery_channel: "system",
            channel_order: 0,
            delivery_status: 'error',
            error_message: "No recipients configured for reminder"
          });
        }
      }
      
      // Track the reminder in sent_reminders (for backward compatibility)
      try {
        await trackInSentReminders(
          reminder.message_id,
          reminder.condition_id,
          messageData.user_id,
          conditionData.trigger_date || reminder.scheduled_at,
          reminder.scheduled_at
        );
      } catch (trackError) {
        console.warn("Error tracking reminder in sent_reminders:", trackError);
        // Continue despite tracking error
      }
    }
    
    // Determine overall success
    const anySuccess = results.some(r => r.success);
    const allFailed = results.length > 0 && results.every(r => !r.success);
    
    // Update the delivery log with final status
    await logFinalDeliveryStatus(
      reminder.id, 
      reminder.message_id, 
      reminder.condition_id,
      anySuccess,
      allFailed,
      results
    );
    
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
      await logDeliveryError({
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
