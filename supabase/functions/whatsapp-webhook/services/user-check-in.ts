
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Perform check-in for ALL of a user's active conditions within edge function
 */
export async function performUserCheckIn(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    console.log(`[WEBHOOK] Performing user check-in for user ${userId}`);
    const now = new Date().toISOString();
    
    // Get all active check-in conditions for the user's messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id")
      .eq("user_id", userId);
      
    if (messagesError) {
      console.error("[WEBHOOK] Error fetching messages:", messagesError);
      return false;
    }
    
    if (!messages || messages.length === 0) {
      console.log("[WEBHOOK] No messages found for user");
      return true;
    }
    
    const messageIds = messages.map(message => message.id);
    
    // Fetch all active check-in type conditions for user's messages
    const { data: conditions, error: fetchError } = await supabase
      .from("message_conditions")
      .select("id, message_id, condition_type")
      .eq("active", true)
      .in("message_id", messageIds)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
      
    if (fetchError) {
      console.error("[WEBHOOK] Error fetching user conditions:", fetchError);
      return false;
    }
    
    console.log(`[WEBHOOK] Found ${conditions?.length || 0} active conditions to update`);
    
    if (!conditions || conditions.length === 0) {
      console.log("[WEBHOOK] No active conditions found for user's messages");
      return true;
    }
    
    // Update all conditions with the new last_checked timestamp
    const { error: updateError } = await supabase
      .from("message_conditions")
      .update({ 
        last_checked: now
      })
      .in("id", conditions.map(condition => condition.id));
      
    if (updateError) {
      console.error("[WEBHOOK] Error updating conditions:", updateError);
      return false;
    }
    
    console.log(`[WEBHOOK] Successfully updated ${conditions.length} conditions`);
    
    // Regenerate reminder schedules for all conditions
    for (const condition of conditions) {
      try {
        await regenerateReminderSchedule(supabase, condition.id);
      } catch (scheduleError) {
        console.error(`[WEBHOOK] Error regenerating reminder schedule for condition ${condition.id}:`, scheduleError);
        // Continue with other conditions even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error("[WEBHOOK] Error in performUserCheckIn:", error);
    return false;
  }
}

/**
 * Helper function to regenerate reminder schedule for a condition
 */
async function regenerateReminderSchedule(
  supabase: SupabaseClient,
  conditionId: string
): Promise<boolean> {
  try {
    // Fetch the condition to get needed data
    const { data: condition, error } = await supabase
      .from('message_conditions')
      .select('*')
      .eq('id', conditionId)
      .single();
      
    if (error) {
      console.error(`[WEBHOOK] Error fetching condition ${conditionId}:`, error);
      return false;
    }
    
    if (!condition) {
      console.error(`[WEBHOOK] Condition ${conditionId} not found`);
      return false;
    }
    
    const messageId = condition.message_id;
    
    // Mark existing reminders as obsolete
    await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId)
      .eq('condition_id', conditionId);
      
    // Calculate effective deadline based on condition type
    // For check-in conditions, the deadline is last_checked + hours_threshold
    if (!['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type)) {
      console.log(`[WEBHOOK] Skipping non-check-in condition ${conditionId}`);
      return true;
    }
    
    if (!condition.last_checked) {
      console.error(`[WEBHOOK] Condition ${conditionId} has no last_checked timestamp`);
      return false;
    }
    
    const lastChecked = new Date(condition.last_checked);
    const hoursToAdd = condition.hours_threshold || 0;
    const minutesToAdd = condition.minutes_threshold || 0;
    
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + hoursToAdd);
    deadline.setMinutes(deadline.getMinutes() + minutesToAdd);
    
    // Parse reminder minutes from the condition
    const reminderMinutes = condition.reminder_hours || [24 * 60]; // Default to 24 hours before deadline
    
    // Generate new reminder entries
    const reminderEntries = reminderMinutes.map(minutes => {
      const scheduledAt = new Date(deadline.getTime() - (minutes * 60 * 1000));
      
      return {
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: scheduledAt.toISOString(),
        reminder_type: 'reminder',
        status: 'pending',
        delivery_priority: minutes < 60 ? 'high' : 'normal',
        retry_strategy: 'standard'
      };
    });
    
    // Add final delivery entry
    reminderEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: deadline.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
    
    // Insert new reminders
    const { error: insertError } = await supabase
      .from('reminder_schedule')
      .insert(reminderEntries);
      
    if (insertError) {
      console.error(`[WEBHOOK] Error inserting new reminders for condition ${conditionId}:`, insertError);
      return false;
    }
    
    console.log(`[WEBHOOK] Successfully regenerated ${reminderEntries.length} reminders for condition ${conditionId}`);
    return true;
  } catch (error) {
    console.error(`[WEBHOOK] Error regenerating reminders for condition ${conditionId}:`, error);
    return false;
  }
}
