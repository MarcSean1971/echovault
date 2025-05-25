
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * SIMPLIFIED REMINDER SERVICE
 * This replaces all the over-engineered reminder logic with simple, predictable functions.
 */

export interface ReminderParams {
  messageId: string;
  conditionId: string;
  conditionType: string;
  triggerDate?: string;
  lastChecked?: string;
  hoursThreshold?: number;
  minutesThreshold?: number;
  reminderHours?: number[];
}

/**
 * Simple function to parse reminder hours array into minutes
 */
function parseReminderHours(reminderHours?: number[]): number[] {
  if (!reminderHours || !Array.isArray(reminderHours)) {
    return [60]; // Default: 1 hour before
  }
  
  return reminderHours.map(hours => {
    if (typeof hours === 'number' && hours > 0) {
      return hours * 60; // Convert hours to minutes
    }
    return 60; // Default fallback
  }).filter(minutes => minutes > 0);
}

/**
 * Calculate the deadline for a message condition
 */
function calculateDeadline(params: ReminderParams): Date | null {
  const now = new Date();
  
  // Method 1: Use explicit trigger date
  if (params.triggerDate) {
    const deadline = new Date(params.triggerDate);
    if (deadline > now) {
      return deadline;
    }
  }
  
  // Method 2: Calculate from last check-in + threshold
  if (params.lastChecked && (params.hoursThreshold || params.minutesThreshold)) {
    const lastChecked = new Date(params.lastChecked);
    const deadline = new Date(lastChecked);
    
    if (params.hoursThreshold) {
      deadline.setHours(deadline.getHours() + params.hoursThreshold);
    }
    
    if (params.minutesThreshold) {
      deadline.setMinutes(deadline.getMinutes() + params.minutesThreshold);
    }
    
    if (deadline > now) {
      return deadline;
    }
  }
  
  return null;
}

/**
 * Calculate reminder times based on deadline and reminder minutes
 */
function calculateReminderTimes(deadline: Date, reminderMinutes: number[]): Date[] {
  const now = new Date();
  const times: Date[] = [];
  
  for (const minutes of reminderMinutes) {
    const reminderTime = new Date(deadline.getTime() - (minutes * 60 * 1000));
    
    // Only include future reminders
    if (reminderTime > now) {
      times.push(reminderTime);
    }
  }
  
  return times.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Main function to create reminder schedule
 */
export async function createReminderSchedule(params: ReminderParams): Promise<boolean> {
  try {
    console.log("[SIMPLE-REMINDER] Creating schedule for:", params);
    
    // Step 1: Calculate deadline
    const deadline = calculateDeadline(params);
    if (!deadline) {
      console.warn("[SIMPLE-REMINDER] No valid deadline could be calculated");
      return false;
    }
    
    console.log("[SIMPLE-REMINDER] Calculated deadline:", deadline.toISOString());
    
    // Step 2: Parse reminder minutes
    const reminderMinutes = parseReminderHours(params.reminderHours);
    console.log("[SIMPLE-REMINDER] Reminder minutes:", reminderMinutes);
    
    // Step 3: Calculate reminder times
    const reminderTimes = calculateReminderTimes(deadline, reminderMinutes);
    console.log("[SIMPLE-REMINDER] Calculated reminder times:", reminderTimes.map(t => t.toISOString()));
    
    if (reminderTimes.length === 0) {
      console.warn("[SIMPLE-REMINDER] No future reminder times calculated");
      return false;
    }
    
    // Step 4: Clear existing reminders
    const { error: deleteError } = await supabase
      .from('reminder_schedule')
      .delete()
      .eq('message_id', params.messageId);
    
    if (deleteError) {
      console.error("[SIMPLE-REMINDER] Error clearing existing reminders:", deleteError);
    }
    
    // Step 5: Create new reminder entries
    const reminderEntries = reminderTimes.map(time => ({
      message_id: params.messageId,
      condition_id: params.conditionId,
      scheduled_at: time.toISOString(),
      reminder_type: 'reminder',
      status: 'pending',
      delivery_priority: 'normal',
      retry_strategy: 'standard'
    }));
    
    // Add final delivery at deadline
    reminderEntries.push({
      message_id: params.messageId,
      condition_id: params.conditionId,
      scheduled_at: deadline.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
    
    const { data, error } = await supabase
      .from('reminder_schedule')
      .insert(reminderEntries);
    
    if (error) {
      console.error("[SIMPLE-REMINDER] Error creating reminder schedule:", error);
      return false;
    }
    
    console.log("[SIMPLE-REMINDER] Successfully created", reminderEntries.length, "reminder entries");
    
    // Step 6: Trigger immediate processing
    try {
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: params.messageId,
          debug: true,
          forceSend: false,
          source: "simple-reminder-creation",
          action: "process"
        }
      });
    } catch (triggerError) {
      console.warn("[SIMPLE-REMINDER] Could not trigger processing:", triggerError);
    }
    
    return true;
    
  } catch (error) {
    console.error("[SIMPLE-REMINDER] Error in createReminderSchedule:", error);
    return false;
  }
}

/**
 * Get upcoming reminders for display
 */
export async function getUpcomingReminders(messageId: string): Promise<{
  upcomingReminders: string[];
  hasReminders: boolean;
}> {
  try {
    const { data: reminders, error } = await supabase
      .from('reminder_schedule')
      .select('scheduled_at, reminder_type')
      .eq('message_id', messageId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error("[SIMPLE-REMINDER] Error fetching reminders:", error);
      return { upcomingReminders: [], hasReminders: false };
    }
    
    if (!reminders || reminders.length === 0) {
      return { upcomingReminders: [], hasReminders: false };
    }
    
    const now = new Date();
    const formatted = reminders
      .filter(r => new Date(r.scheduled_at) > now)
      .map(reminder => {
        const time = new Date(reminder.scheduled_at);
        const timeUntil = time.getTime() - now.getTime();
        const hoursUntil = Math.round(timeUntil / (1000 * 60 * 60));
        
        if (reminder.reminder_type === 'final_delivery') {
          return `Final Delivery: ${time.toLocaleString()}`;
        } else {
          return `Check-in Reminder: ${hoursUntil}h (${time.toLocaleString()})`;
        }
      });
    
    return {
      upcomingReminders: formatted,
      hasReminders: formatted.length > 0
    };
    
  } catch (error) {
    console.error("[SIMPLE-REMINDER] Error in getUpcomingReminders:", error);
    return { upcomingReminders: [], hasReminders: false };
  }
}

/**
 * Mark reminders as obsolete when conditions change
 */
export async function markRemindersObsolete(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('message_id', messageId)
      .eq('status', 'pending');
    
    if (error) {
      console.error("[SIMPLE-REMINDER] Error marking reminders obsolete:", error);
    } else {
      console.log("[SIMPLE-REMINDER] Marked reminders obsolete for message:", messageId);
    }
  } catch (error) {
    console.error("[SIMPLE-REMINDER] Error in markRemindersObsolete:", error);
  }
}
