import { supabaseClient } from "./supabase-client.ts";
import { ReminderData } from "./types/reminder-types.ts";
import { calculateNextReminderTime } from "./utils/reminder-calculator.ts";
import { updateNextReminderTime } from "./db/reminder-tracking.ts";

/**
 * Get messages that need reminders
 */
export async function getMessagesNeedingReminders(
  specificMessageId?: string, 
  forceSend: boolean = false
): Promise<ReminderData[]> {
  try {
    const supabase = supabaseClient();
    const messagesToRemind: ReminderData[] = [];
    
    console.log(`====== STARTING REMINDER CHECK ======`);
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Looking for messages${specificMessageId ? ` with ID ${specificMessageId}` : ''}`);
    console.log(`Force send: ${forceSend}`);
    
    // Query conditions that are active and have reminders configured
    // IMPORTANT: Exclude panic_trigger condition types as they should not have reminders
    let query = supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        active,
        condition_type,
        recipients,
        trigger_date, 
        reminder_hours,
        next_reminder_at,
        panic_config,
        hours_threshold,
        minutes_threshold,
        last_checked,
        messages (
          id,
          title,
          content,
          message_type,
          user_id,
          created_at,
          updated_at
        )
      `)
      .eq('active', true)
      .not('reminder_hours', 'is', null)
      .neq('condition_type', 'panic_trigger'); // Filter out panic trigger conditions
    
    // If specificMessageId is provided, add that filter
    if (specificMessageId) {
      query = query.eq('message_id', specificMessageId);
    }
    
    const { data: conditions, error } = await query;
    
    if (error) {
      console.error("Error fetching conditions for reminders:", error);
      throw error;
    }
    
    console.log(`DB: Found ${conditions?.length || 0} active conditions with reminder_hours defined (excluding panic triggers)`);
    
    const now = new Date();
    console.log(`DB: Current time: ${now.toISOString()}`);
    
    // Process each condition
    for (const condition of conditions || []) {
      console.log(`\n====== PROCESSING CONDITION ${condition.id} ======`);
      console.log(`Condition type: ${condition.condition_type}`);
      console.log(`Message ID: ${condition.message_id}`);
      
      // Skip panic trigger conditions (extra safety check)
      if (condition.condition_type === 'panic_trigger') {
        console.log(`DB: Skipping panic trigger condition ${condition.id}, panic buttons should not have reminders`);
        continue;
      }
      
      // Skip if no reminder hours (which contains minutes)
      if (!condition.reminder_hours || condition.reminder_hours.length === 0) {
        console.log(`DB: No reminder minutes for condition ${condition.id}, skipping`);
        continue;
      }
      
      // For check-in conditions (no_check_in, recurring_check_in, inactivity_to_date),
      // create a virtual trigger_date based on last_checked + hours_threshold
      let effectiveTriggerDate = condition.trigger_date;
      let isCheckInCondition = false;
      
      if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
        isCheckInCondition = true;
        
        if (condition.last_checked && condition.hours_threshold) {
          // Calculate virtual trigger_date as last_checked + threshold
          const lastChecked = new Date(condition.last_checked);
          const hoursToAdd = condition.hours_threshold || 0;
          const minutesToAdd = condition.minutes_threshold || 0;
          
          const virtualDeadline = new Date(lastChecked);
          virtualDeadline.setHours(virtualDeadline.getHours() + hoursToAdd);
          virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesToAdd);
          
          effectiveTriggerDate = virtualDeadline.toISOString();
          
          console.log(`DB: Check-in condition detected (${condition.condition_type})`);
          console.log(`DB: Last checked: ${lastChecked.toISOString()}`);
          console.log(`DB: Threshold: ${hoursToAdd} hours, ${minutesToAdd} minutes`);
          console.log(`DB: Virtual deadline calculated: ${effectiveTriggerDate}`);
        } else {
          console.log(`DB: Check-in condition missing last_checked or hours_threshold, cannot calculate virtual deadline`);
        }
      }
      
      // Skip if no trigger_date (actual or virtual) AND NOT forceSend
      if (!effectiveTriggerDate && !forceSend) {
        console.log(`DB: No effective trigger_date for condition ${condition.id} and forceSend is not enabled, skipping`);
        continue;
      }
      
      const message = condition.messages;
      
      if (!message) {
        console.log(`DB: No message found for condition ${condition.id}, skipping`);
        continue;
      }
      
      console.log(`Message title: "${message.title}"`);
      console.log(`Creator user_id: ${message.user_id}`);
      
      // Calculate hours until deadline or use a default for forced sends
      let hoursUntilDeadline = 24; // Default to 24 hours if no trigger_date for forced sends
      
      if (effectiveTriggerDate) {
        const deadline = new Date(effectiveTriggerDate);
        hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        console.log(`DB: Message ${message.id} has effective trigger_date ${effectiveTriggerDate}`);
        console.log(`DB: Hours until deadline: ${hoursUntilDeadline.toFixed(2)} hours (${hoursUntilDeadline * 60} minutes)`);
      } else if (forceSend) {
        console.log(`DB: Force sending reminder for message ${message.id} with no trigger_date, using default ${hoursUntilDeadline} hours`);
      }
      
      // CRITICAL FIX: reminder_hours actually contains values in MINUTES, not hours!
      const reminderMinutes = condition.reminder_hours as number[];
      console.log(`DB: Reminder minutes in database: ${JSON.stringify(reminderMinutes)}`);
      
      let shouldSendReminder = false;
      let matchedReminderMinute = null;
      
      // Check if we have a scheduled next reminder time that's now due
      if (condition.next_reminder_at) {
        const nextReminderAt = new Date(condition.next_reminder_at);
        const diffMinutes = (nextReminderAt.getTime() - now.getTime()) / (60 * 1000);
        
        console.log(`DB: Next reminder scheduled for: ${nextReminderAt.toISOString()}`);
        console.log(`DB: Minutes until scheduled reminder: ${diffMinutes.toFixed(1)}`);
        
        // If the scheduled reminder is due (within 15 minutes before or after the scheduled time)
        if (Math.abs(diffMinutes) < 15) {
          shouldSendReminder = true;
          
          // Find which reminder minute this corresponds to
          for (const minute of reminderMinutes) {
            if (effectiveTriggerDate) {
              const deadline = new Date(effectiveTriggerDate);
              const reminderTime = new Date(deadline.getTime() - (minute * 60 * 1000));
              const diffToScheduled = Math.abs((reminderTime.getTime() - nextReminderAt.getTime()) / (60 * 1000));
              
              if (diffToScheduled < 5) { // If within 5 minutes, it's the right one
                matchedReminderMinute = minute;
                console.log(`DB: Matched scheduled reminder to ${minute} minutes configuration`);
                break;
              }
            }
          }
          
          console.log(`DB: Scheduled reminder is now due, will send reminder`);
        }
      }
      
      // If not sending based on schedule, check if force send or if we match a reminder window
      if (!shouldSendReminder) {
        if (forceSend) {
          // If forceSend is true, always send a reminder
          shouldSendReminder = true;
          console.log(`DB: Force sending reminder for message ${message.id}, deadline in ${effectiveTriggerDate ? hoursUntilDeadline.toFixed(1) : 'N/A'} hours`);
        } else if (effectiveTriggerDate) {
          // Check if the current time matches any reminder window
          for (const reminderMinute of reminderMinutes) {
            // Convert reminder minutes to hours for proper comparison
            const reminderInHours = reminderMinute / 60;
            
            // Reminder should be sent if current time is within 15 minutes (0.25 hours) of the reminder time
            const difference = Math.abs(hoursUntilDeadline - reminderInHours);
            console.log(`DB: Checking reminder time ${reminderMinute} minutes (${reminderInHours.toFixed(2)} hours), difference: ${difference.toFixed(2)} hours`);
            
            if (difference < 0.25) { // Within 15 minutes window
              shouldSendReminder = true;
              matchedReminderMinute = reminderMinute;
              console.log(`DB: MATCH FOUND! Time difference ${difference.toFixed(2)} hours is within 15-minute window`);
              console.log(`DB: Will send reminder for ${reminderMinute} minutes (${reminderInHours.toFixed(2)} hours) before deadline`);
              break;
            }
          }
        }
      }
      
      // If we decide to send a reminder, add it to the list
      if (shouldSendReminder) {
        console.log(`DB: Will send reminder for message ${message.id} "${message.title}"`);
        
        // Calculate when the next reminder would be after this one
        if (effectiveTriggerDate) {
          const deadline = new Date(effectiveTriggerDate);
          const nextReminderTime = calculateNextReminderTime(deadline, reminderMinutes, matchedReminderMinute);
          
          if (nextReminderTime) {
            console.log(`DB: Next reminder calculated for: ${nextReminderTime.toISOString()}`);
            
            // Update the next_reminder_at in the database
            await updateNextReminderTime(condition.id, nextReminderTime.toISOString());
          } else {
            console.log(`DB: No more reminders after this one`);
            await updateNextReminderTime(condition.id, null);
          }
        }
        
        // Handle check-in conditions specifically
        if (isCheckInCondition) {
          console.log(`DB: This is a check-in type condition (${condition.condition_type})`);
          console.log(`DB: For check-in conditions, reminder goes to creator (${message.user_id})`);
        } else if (condition.recipients) {
          console.log(`DB: Recipients count: ${condition.recipients.length}`);
        }
        
        messagesToRemind.push({
          message: message as any,
          condition: {
            ...condition,
            trigger_date: effectiveTriggerDate || condition.trigger_date // Use effective trigger date for further processing
          } as any,
          hoursUntilDeadline: hoursUntilDeadline,
          reminderMinutes: reminderMinutes,
          matchedReminderMinute: matchedReminderMinute
        });
      } else {
        console.log(`DB: No reminder needed for message ${message.id} at this time. No matching reminder time.`);
        
        // If there's no next_reminder_at set, calculate and set it
        if (!condition.next_reminder_at && effectiveTriggerDate) {
          const deadline = new Date(effectiveTriggerDate);
          const nextReminderTime = calculateNextReminderTime(deadline, reminderMinutes, null);
          
          if (nextReminderTime) {
            console.log(`DB: Setting initial next reminder time to: ${nextReminderTime.toISOString()}`);
            await updateNextReminderTime(condition.id, nextReminderTime.toISOString());
          }
        }
      }
    }
    
    console.log(`\n====== REMINDER CHECK SUMMARY ======`);
    console.log(`Found ${messagesToRemind.length} messages that need reminders`);
    
    return messagesToRemind;
  } catch (error: any) {
    console.error("Error getting messages needing reminders:", error);
    throw error;
  }
}
