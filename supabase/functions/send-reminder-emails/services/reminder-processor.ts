import { supabaseClient } from "../supabase-client.ts";
import { sendCheckInEmailToCreator } from "./email-sender.ts";
import { reminderLogger } from "./reminder-logger.ts";

/**
 * FIXED: Email-only processor that does NOT change reminder status
 * This allows the enhanced dual-channel processor to handle final status updates
 */
export async function processIndividualReminder(
  reminder: any,
  debug: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    console.log(`[EMAIL-PROCESSOR] Processing reminder ${reminder.id}`, {
      reminderType: reminder.reminder_type,
      messageId: reminder.message_id,
      conditionId: reminder.condition_id,
      scheduledAt: reminder.scheduled_at,
      retryCount: reminder.retry_count || 0
    });
    
    // Only process reminder_type = 'reminder' (check-in reminders to creators)
    if (reminder.reminder_type !== 'reminder') {
      throw new Error(`Wrong reminder type: ${reminder.reminder_type}. Only 'reminder' type allowed.`);
    }
    
    // Get message and condition details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, title, user_id')
      .eq('id', reminder.message_id)
      .single();
      
    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message || 'Unknown error'}`);
    }
    
    const { data: condition, error: conditionError } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('id', reminder.condition_id)
      .single();
      
    if (conditionError || !condition) {
      throw new Error(`Condition not found: ${conditionError?.message || 'Unknown error'}`);
    }
    
    // Calculate time until scheduled time for display purposes
    const scheduledTime = new Date(reminder.scheduled_at);
    const now = new Date();
    const hoursUntilScheduled = Math.max(0, (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    console.log(`[EMAIL-PROCESSOR] Sending check-in reminder for message "${message.title}" to creator ${message.user_id}`);
    
    // Get creator's profile and email
    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', message.user_id)
      .single();
    
    if (profileError || !creatorProfile?.email) {
      throw new Error(`Creator profile or email not found: ${profileError?.message || 'No email'}`);
    }
    
    console.log(`[EMAIL-PROCESSOR] Sending email to creator: ${creatorProfile.email}`);
    
    // Send email reminder
    const emailResult = await sendCheckInEmailToCreator(
      creatorProfile.email,
      creatorProfile.first_name || 'User',
      message.title,
      message.id,
      hoursUntilScheduled
    );
    
    // CRITICAL FIX: Do NOT mark reminder as sent here
    // Let the enhanced dual-channel processor handle the final status update
    if (emailResult.success) {
      console.log(`[EMAIL-PROCESSOR] Email sent successfully, but NOT updating reminder status (letting dual-channel processor handle it)`);
      
      // Only update last_attempt_at to track processing, but keep status as 'pending'
      const { error: updateError } = await supabase
        .from('reminder_schedule')
        .update({
          last_attempt_at: new Date().toISOString()
          // Deliberately NOT changing status here
        })
        .eq('id', reminder.id);
        
      if (updateError) {
        console.error(`[EMAIL-PROCESSOR] Error updating last_attempt_at:`, updateError);
      }
      
      return { success: true };
    } else {
      // Email failed - increment retry count but don't mark as failed yet
      const newRetryCount = (reminder.retry_count || 0) + 1;
      const maxRetries = 3;
      
      if (newRetryCount < maxRetries) {
        // Schedule for retry in 5 minutes
        const retryTime = new Date(Date.now() + 5 * 60 * 1000);
        
        const { error: updateError } = await supabase
          .from('reminder_schedule')
          .update({
            scheduled_at: retryTime.toISOString(),
            last_attempt_at: new Date().toISOString(),
            retry_count: newRetryCount
            // Keep status as 'pending' for retry
          })
          .eq('id', reminder.id);
          
        if (updateError) {
          console.error(`[EMAIL-PROCESSOR] Error scheduling retry:`, updateError);
        } else {
          console.log(`[EMAIL-PROCESSOR] Scheduled retry ${newRetryCount}/${maxRetries} for reminder ${reminder.id} at ${retryTime.toISOString()}`);
        }
      } else {
        // Max retries reached, mark as failed
        const { error: updateError } = await supabase
          .from('reminder_schedule')
          .update({
            status: 'failed',
            last_attempt_at: new Date().toISOString(),
            retry_count: newRetryCount
          })
          .eq('id', reminder.id);
          
        if (updateError) {
          console.error(`[EMAIL-PROCESSOR] Error marking reminder as failed:`, updateError);
        } else {
          console.log(`[EMAIL-PROCESSOR] Marked reminder ${reminder.id} as failed after ${newRetryCount} attempts`);
        }
      }
      
      throw new Error(`Email delivery failed for reminder ${reminder.id}: ${emailResult.error}`);
    }
    
  } catch (error: any) {
    console.error(`[EMAIL-PROCESSOR] Error processing reminder ${reminder.id}:`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown processing error' 
    };
  }
}

/**
 * Reset stuck reminders and create new ones for active conditions
 */
export async function resetAndCreateReminders(): Promise<{ resetCount: number; createdCount: number }> {
  const supabase = supabaseClient();
  let resetCount = 0;
  let createdCount = 0;
  
  try {
    console.log("[REMINDER-PROCESSOR] Resetting failed reminders and creating new ones...");
    
    // Reset failed reminders to pending for retry
    const { data: failedReminders, error: fetchError } = await supabase
      .from('reminder_schedule')
      .select('*')
      .eq('status', 'failed')
      .eq('reminder_type', 'reminder')
      .lt('retry_count', 3);
    
    if (fetchError) {
      console.error("[REMINDER-PROCESSOR] Error fetching failed reminders:", fetchError);
    } else if (failedReminders && failedReminders.length > 0) {
      console.log(`[REMINDER-PROCESSOR] Found ${failedReminders.length} failed reminders to reset`);
      
      // Reset them to pending with immediate scheduling
      const { error: resetError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'pending',
          scheduled_at: new Date().toISOString(), // Make them due now
          last_attempt_at: null
        })
        .in('id', failedReminders.map(r => r.id));
      
      if (resetError) {
        console.error("[REMINDER-PROCESSOR] Error resetting failed reminders:", resetError);
      } else {
        resetCount = failedReminders.length;
        console.log(`[REMINDER-PROCESSOR] Reset ${resetCount} failed reminders to pending`);
      }
    }
    
    // Find active conditions that need check-in reminders
    const { data: activeConditions, error: conditionsError } = await supabase
      .from('message_conditions')
      .select(`
        *,
        messages!inner(id, title, user_id)
      `)
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'recurring_check_in', 'inactivity_to_date']);
    
    if (conditionsError) {
      console.error("[REMINDER-PROCESSOR] Error fetching active conditions:", conditionsError);
    } else if (activeConditions && activeConditions.length > 0) {
      console.log(`[REMINDER-PROCESSOR] Found ${activeConditions.length} active conditions needing reminders`);
      
      for (const condition of activeConditions) {
        // Check if there are already pending reminders for this condition
        const { data: existingReminders } = await supabase
          .from('reminder_schedule')
          .select('id')
          .eq('message_id', condition.message_id)
          .eq('condition_id', condition.id)
          .eq('reminder_type', 'reminder')
          .eq('status', 'pending');
        
        if (!existingReminders || existingReminders.length === 0) {
          // Calculate when the next reminder should be sent
          const lastChecked = new Date(condition.last_checked);
          const hoursThreshold = condition.hours_threshold || 24;
          const minutesThreshold = condition.minutes_threshold || 0;
          
          // Calculate deadline
          const deadline = new Date(lastChecked);
          deadline.setHours(deadline.getHours() + hoursThreshold);
          deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
          
          const now = new Date();
          const timeUntilDeadline = deadline.getTime() - now.getTime();
          
          if (timeUntilDeadline > 0) {
            // Schedule a reminder 1 hour before deadline (or now if less than 1 hour remaining)
            const reminderTime = new Date(deadline.getTime() - (60 * 60 * 1000)); // 1 hour before
            const scheduledAt = reminderTime < now ? now : reminderTime;
            
            console.log(`[REMINDER-PROCESSOR] Creating new reminder for message ${condition.message_id}, scheduled at ${scheduledAt.toISOString()}`);
            
            const { error: insertError } = await supabase
              .from('reminder_schedule')
              .insert({
                message_id: condition.message_id,
                condition_id: condition.id,
                scheduled_at: scheduledAt.toISOString(),
                reminder_type: 'reminder',
                status: 'pending',
                delivery_priority: 'high',
                retry_strategy: 'standard'
              });
            
            if (insertError) {
              console.error(`[REMINDER-PROCESSOR] Error creating reminder for condition ${condition.id}:`, insertError);
            } else {
              createdCount++;
              console.log(`[REMINDER-PROCESSOR] Created new reminder for condition ${condition.id}`);
            }
          } else {
            console.log(`[REMINDER-PROCESSOR] Deadline already passed for condition ${condition.id}, skipping reminder creation`);
          }
        } else {
          console.log(`[REMINDER-PROCESSOR] Reminder already exists for condition ${condition.id}`);
        }
      }
    }
    
    console.log(`[REMINDER-PROCESSOR] Reset operation complete: ${resetCount} reset, ${createdCount} created`);
    return { resetCount, createdCount };
    
  } catch (error: any) {
    console.error("[REMINDER-PROCESSOR] Error in resetAndCreateReminders:", error);
    return { resetCount, createdCount };
  }
}

/**
 * Processes multiple due reminders with enhanced retry logic
 */
export async function processDueReminders(
  messageId?: string,
  forceSend: boolean = false,
  debug: boolean = false
): Promise<{ processedCount: number; successCount: number; failedCount: number; errors: string[] }> {
  const supabase = supabaseClient();
  const results = {
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    errors: [] as string[]
  };
  
  try {
    console.log(`[REMINDER-PROCESSOR] Processing check-in reminders for creators ONLY`, {
      messageId,
      forceSend,
      debug
    });
    
    // First, reset failed reminders and create new ones if needed
    const { resetCount, createdCount } = await resetAndCreateReminders();
    console.log(`[REMINDER-PROCESSOR] Reset ${resetCount} failed reminders, created ${createdCount} new reminders`);
    
    // Get due check-in reminders (reminder_type = 'reminder')
    let checkInQuery = supabase
      .from('reminder_schedule')
      .select('*')
      .eq('reminder_type', 'reminder') // ONLY check-in reminders
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());
    
    if (messageId) {
      checkInQuery = checkInQuery.eq('message_id', messageId);
    }
    
    const { data: checkInReminders, error: checkInError } = await checkInQuery.limit(25);
    
    if (checkInError) {
      console.error(`[REMINDER-PROCESSOR] Error fetching check-in reminders:`, checkInError);
      results.errors.push(`Check-in query error: ${checkInError.message}`);
    } else if (checkInReminders && checkInReminders.length > 0) {
      console.log(`[REMINDER-PROCESSOR] Found ${checkInReminders.length} due check-in reminders`);
      
      for (const reminder of checkInReminders) {
        const reminderResult = await processIndividualReminder(reminder, debug);
        results.processedCount++;
        
        if (reminderResult.success) {
          results.successCount++;
        } else {
          results.failedCount++;
          results.errors.push(`Reminder ${reminder.id}: ${reminderResult.error}`);
        }
      }
    } else {
      console.log(`[REMINDER-PROCESSOR] No due check-in reminders found`);
    }
    
    return results;
    
  } catch (error: any) {
    console.error(`[REMINDER-PROCESSOR] Critical error in processing:`, error);
    results.errors.push(`Critical processing error: ${error.message}`);
    return results;
  }
}
