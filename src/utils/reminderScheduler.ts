import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

/**
 * Generate and store reminder schedule for a message
 */
export async function generateReminderSchedule(
  messageId: string,
  conditionId: string,
  triggerDate: Date | null,
  reminderMinutes: number[]
): Promise<boolean> {
  try {
    if (!triggerDate) {
      console.error(`[REMINDER-SCHEDULER] Cannot generate reminder schedule for message ${messageId} - no trigger date provided`);
      return false;
    }
    
    if (!reminderMinutes || reminderMinutes.length === 0) {
      console.error(`[REMINDER-SCHEDULER] Cannot generate reminder schedule for message ${messageId} - no reminder minutes provided`);
      return false;
    }
    
    console.log(`[REMINDER-SCHEDULER] Generating reminder schedule for message ${messageId}, condition ${conditionId}`);
    console.log(`[REMINDER-SCHEDULER] Trigger date: ${triggerDate.toISOString()}`);
    console.log(`[REMINDER-SCHEDULER] Reminder minutes: ${JSON.stringify(reminderMinutes)}`);
    
    // Mark existing reminders as obsolete first
    const markResult = await markExistingRemindersObsolete(messageId);
    if (!markResult) {
      console.warn(`[REMINDER-SCHEDULER] Warning: Failed to mark existing reminders as obsolete for message ${messageId}`);
      // Continue despite warning, as we still want to try creating new reminders
    }
    
    // Generate reminder timestamps
    const scheduleEntries = reminderMinutes.map(minutes => {
      const scheduledAt = new Date(triggerDate.getTime() - (minutes * 60 * 1000));
      return {
        message_id: messageId,
        condition_id: conditionId,
        scheduled_at: scheduledAt.toISOString(),
        reminder_type: 'reminder',
        status: 'pending',
        delivery_priority: 'normal',
        retry_strategy: 'standard'
      };
    });
    
    // Add final delivery timestamp with higher priority and robust retry settings
    scheduleEntries.push({
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: triggerDate.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical', // Mark as critical priority
      retry_strategy: 'aggressive' // Use aggressive retry strategy
    });
    
    console.log(`[REMINDER-SCHEDULER] Generated ${scheduleEntries.length} schedule entries for message ${messageId}`);
    
    // Insert schedule entries with conflict handling for idempotency
    const { data, error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleEntries, {
        onConflict: 'message_id,condition_id,scheduled_at,reminder_type',
        ignoreDuplicates: false // Change to false to get error feedback if insert fails
      });
    
    if (error) {
      console.error("[REMINDER-SCHEDULER] Error storing reminder schedule:", error);
      
      // Handle RLS security errors specifically
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        toast({
          title: "Permission Error",
          description: "You don't have permission to create reminders for this message.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        toast({
          title: "Reminder Schedule Error",
          description: "Failed to create reminder schedule. Please try again or contact support.",
          variant: "destructive",
          duration: 5000
        });
      }
      return false;
    }
    
    console.log(`[REMINDER-SCHEDULER] Successfully stored reminder schedule for message ${messageId}`);
    
    // Verify that reminders were actually created by checking the database
    try {
      const { count, error: countError } = await supabase
        .from('reminder_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', messageId)
        .eq('status', 'pending');
        
      if (countError) {
        console.error("[REMINDER-SCHEDULER] Error verifying reminder count:", countError);
      } else {
        console.log(`[REMINDER-SCHEDULER] Verified ${count} pending reminders exist for message ${messageId}`);
        
        if (count === 0) {
          console.error("[REMINDER-SCHEDULER] No reminders were created despite no error! This might indicate a constraint issue.");
          toast({
            title: "Reminder Warning",
            description: "No reminders were created. Please check system settings.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
    } catch (verifyError) {
      console.error("[REMINDER-SCHEDULER] Error during verification:", verifyError);
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SCHEDULER] Error in generateReminderSchedule:", error);
    toast({
      title: "Reminder Schedule Error",
      description: "An unexpected error occurred setting up reminders.",
      variant: "destructive",
      duration: 5000
    });
    return false;
  }
}

/**
 * Mark existing reminders as obsolete when creating new schedule
 * Fixed to use messageId consistently
 */
async function markExistingRemindersObsolete(messageId: string): Promise<boolean> {
  try {
    console.log(`[REMINDER-SCHEDULER] Marking existing reminders as obsolete for message ${messageId}`);
    
    // CRITICAL FIX: Use message_id in the query to properly mark reminders as obsolete
    const { error, count } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    if (error) {
      // Check if this is an RLS permission error
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SCHEDULER] Permission denied marking reminders as obsolete - user likely doesn't own this message");
        return false;
      }
      
      console.error("[REMINDER-SCHEDULER] Error marking reminders as obsolete:", error);
      return false;
    }
    
    console.log(`[REMINDER-SCHEDULER] Marked ${count || 0} reminders as obsolete for message ${messageId}`);
    return true;
  } catch (error) {
    console.error("[REMINDER-SCHEDULER] Error in markExistingRemindersObsolete:", error);
    return false;
  }
}

/**
 * Generate schedule for check-in type conditions
 */
export async function generateCheckInReminderSchedule(
  messageId: string,
  conditionId: string,
  lastCheckedDate: Date | null,
  hoursThreshold: number,
  minutesThreshold: number = 0,
  reminderMinutes: number[]
): Promise<boolean> {
  try {
    if (!lastCheckedDate) {
      console.error(`[REMINDER-SCHEDULER] Cannot generate check-in reminder schedule for message ${messageId} - no last checked date`);
      return false;
    }
    
    if (reminderMinutes.length === 0) {
      console.warn(`[REMINDER-SCHEDULER] No reminder minutes provided for message ${messageId}, using default`);
      reminderMinutes = [24 * 60]; // Default to 24 hours before deadline if none specified
    }
    
    // Calculate virtual deadline based on last check-in + threshold
    const virtualDeadline = new Date(lastCheckedDate);
    virtualDeadline.setHours(virtualDeadline.getHours() + hoursThreshold);
    virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesThreshold);
    
    console.log(`[REMINDER-SCHEDULER] Generating check-in reminder schedule for message ${messageId}`);
    console.log(`[REMINDER-SCHEDULER] Last checked: ${lastCheckedDate.toISOString()}`);
    console.log(`[REMINDER-SCHEDULER] Hours threshold: ${hoursThreshold}, Minutes threshold: ${minutesThreshold}`);
    console.log(`[REMINDER-SCHEDULER] Virtual deadline: ${virtualDeadline.toISOString()}`);
    console.log(`[REMINDER-SCHEDULER] Reminder minutes: ${JSON.stringify(reminderMinutes)}`);
    
    return generateReminderSchedule(messageId, conditionId, virtualDeadline, reminderMinutes);
  } catch (error) {
    console.error("[REMINDER-SCHEDULER] Error in generateCheckInReminderSchedule:", error);
    return false;
  }
}

/**
 * Get upcoming reminders for a message
 * Updated to handle potential permission errors from RLS
 */
export async function getUpcomingReminders(messageId: string): Promise<{ 
  scheduledAt: Date, 
  reminderType: string,
  priority?: string 
}[]> {
  try {
    // Only get non-obsolete reminders
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('scheduled_at, reminder_type, delivery_priority, status')
      .eq('message_id', messageId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      // Handle RLS specific errors
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SCHEDULER] Permission denied accessing reminders - user likely doesn't own this message");
        throw new Error(`Permission denied: ${error.message}`);
      } else {
        console.error("[REMINDER-SCHEDULER] Error fetching upcoming reminders:", error);
        throw error;
      }
    }
    
    if (!data) {
      return [];
    }
    
    console.log(`[REMINDER-SCHEDULER] Found ${data.length} pending reminders for message ${messageId}`);
    
    // For debugging, log the reminders
    data.forEach((reminder, idx) => {
      console.log(`[REMINDER-SCHEDULER] Reminder ${idx+1}: ${reminder.reminder_type} at ${reminder.scheduled_at} (status: ${reminder.status})`);
    });
    
    return data.map(item => ({
      scheduledAt: new Date(item.scheduled_at),
      reminderType: item.reminder_type,
      priority: item.delivery_priority || 'normal'
    }));
  } catch (error) {
    console.error("[REMINDER-SCHEDULER] Error in getUpcomingReminders:", error);
    throw error; // Re-throw to allow proper handling by callers
  }
}

/**
 * NEW: Get upcoming reminders for multiple messages in a single batch query
 * This eliminates the N+1 query pattern by fetching all reminders at once
 */
export async function getUpcomingRemindersForMultipleMessages(messageIds: string[]): Promise<
  Record<string, { scheduledAt: Date, reminderType: string, priority?: string }[]>
> {
  if (!messageIds || messageIds.length === 0) {
    return {};
  }
  
  try {
    console.log(`[REMINDER-SCHEDULER] Batch fetching reminders for ${messageIds.length} messages`);
    
    // Only get non-obsolete reminders
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('message_id, scheduled_at, reminder_type, delivery_priority, status')
      .in('message_id', messageIds)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error("[REMINDER-SCHEDULER] Error batch fetching reminders:", error);
      return {};
    }
    
    if (!data || data.length === 0) {
      console.log("[REMINDER-SCHEDULER] No reminders found in batch query");
      return {};
    }
    
    console.log(`[REMINDER-SCHEDULER] Found ${data.length} pending reminders across ${messageIds.length} messages`);
    
    // Group reminders by message_id
    const remindersByMessage: Record<string, { scheduledAt: Date, reminderType: string, priority?: string }[]> = {};
    
    // Initialize all message IDs with empty arrays (so we return data for all messages, even those with no reminders)
    messageIds.forEach(id => {
      remindersByMessage[id] = [];
    });
    
    // Populate with actual reminders
    data.forEach(item => {
      if (!remindersByMessage[item.message_id]) {
        remindersByMessage[item.message_id] = [];
      }
      
      remindersByMessage[item.message_id].push({
        scheduledAt: new Date(item.scheduled_at),
        reminderType: item.reminder_type,
        priority: item.delivery_priority || 'normal'
      });
    });
    
    return remindersByMessage;
  } catch (error) {
    console.error("[REMINDER-SCHEDULER] Error in getUpcomingRemindersForMultipleMessages:", error);
    return {};
  }
}

/**
 * Format reminder schedule for display
 */
export function formatReminderSchedule(schedule: { scheduledAt: Date, reminderType: string, priority?: string }[]): string[] {
  return schedule.map(item => {
    const formattedTime = format(item.scheduledAt, "MMM d, yyyy h:mm a");
    const typeName = item.reminderType === 'reminder' ? 'Reminder' : 
                    (item.reminderType === 'final_delivery' ? 'Final Delivery' : item.reminderType);
    const priorityFlag = item.priority === 'critical' ? ' (Critical)' : '';
    
    return `${formattedTime} (${typeName}${priorityFlag})`;
  });
}
