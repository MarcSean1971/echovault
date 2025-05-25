
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
 * Calculate the deadline for a message condition - FIXED VERSION
 */
function calculateDeadline(params: ReminderParams): Date | null {
  const now = new Date();
  
  console.log("[SIMPLE-REMINDER] Calculating deadline with params:", {
    triggerDate: params.triggerDate,
    lastChecked: params.lastChecked,
    hoursThreshold: params.hoursThreshold,
    minutesThreshold: params.minutesThreshold
  });
  
  // Method 1: Use explicit trigger date
  if (params.triggerDate) {
    const deadline = new Date(params.triggerDate);
    if (deadline > now) {
      console.log("[SIMPLE-REMINDER] Using trigger date deadline:", deadline.toISOString());
      return deadline;
    }
    console.log("[SIMPLE-REMINDER] Trigger date is in the past, skipping");
  }
  
  // Method 2: Calculate from last check-in + threshold - FIXED LOGIC
  if (params.lastChecked && (
    (params.hoursThreshold !== undefined && params.hoursThreshold !== null) || 
    (params.minutesThreshold !== undefined && params.minutesThreshold !== null)
  )) {
    const lastChecked = new Date(params.lastChecked);
    const deadline = new Date(lastChecked);
    
    // Apply hours threshold (even if it's 0)
    if (params.hoursThreshold !== undefined && params.hoursThreshold !== null) {
      deadline.setHours(deadline.getHours() + params.hoursThreshold);
      console.log("[SIMPLE-REMINDER] Added hours threshold:", params.hoursThreshold);
    }
    
    // Apply minutes threshold (even if it's 0)
    if (params.minutesThreshold !== undefined && params.minutesThreshold !== null) {
      deadline.setMinutes(deadline.getMinutes() + params.minutesThreshold);
      console.log("[SIMPLE-REMINDER] Added minutes threshold:", params.minutesThreshold);
    }
    
    if (deadline > now) {
      console.log("[SIMPLE-REMINDER] Using calculated deadline:", deadline.toISOString());
      return deadline;
    }
    console.log("[SIMPLE-REMINDER] Calculated deadline is in the past");
  }
  
  console.log("[SIMPLE-REMINDER] No valid deadline could be calculated");
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
 * Verify reminder entries were created in database
 */
async function verifyReminderCreation(messageId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('id, scheduled_at, reminder_type')
      .eq('message_id', messageId)
      .eq('status', 'pending');
    
    if (error) {
      console.error("[SIMPLE-REMINDER] Error verifying reminders:", error);
      return 0;
    }
    
    console.log("[SIMPLE-REMINDER] Verified reminder entries:", data?.length || 0);
    data?.forEach(reminder => {
      console.log(`[SIMPLE-REMINDER] - ${reminder.reminder_type} at ${reminder.scheduled_at}`);
    });
    
    return data?.length || 0;
  } catch (error) {
    console.error("[SIMPLE-REMINDER] Error in verification:", error);
    return 0;
  }
}

/**
 * Main function to create reminder schedule - IMPROVED VERSION
 */
export async function createReminderSchedule(params: ReminderParams): Promise<boolean> {
  try {
    console.log("[SIMPLE-REMINDER] Creating schedule for:", params);
    
    // Enhanced parameter validation
    if (!params.messageId || !params.conditionId) {
      console.error("[SIMPLE-REMINDER] Missing required parameters:", params);
      return false;
    }
    
    // Step 1: Calculate deadline with improved logic
    const deadline = calculateDeadline(params);
    if (!deadline) {
      console.warn("[SIMPLE-REMINDER] No valid deadline could be calculated");
      console.warn("[SIMPLE-REMINDER] Parameters were:", {
        triggerDate: params.triggerDate,
        lastChecked: params.lastChecked,
        hoursThreshold: params.hoursThreshold,
        minutesThreshold: params.minutesThreshold
      });
      return false;
    }
    
    console.log("[SIMPLE-REMINDER] Successfully calculated deadline:", deadline.toISOString());
    
    // Step 2: Parse reminder minutes with better handling
    const reminderMinutes = parseReminderHours(params.reminderHours);
    console.log("[SIMPLE-REMINDER] Parsed reminder minutes:", reminderMinutes);
    
    // Step 3: Calculate reminder times
    const reminderTimes = calculateReminderTimes(deadline, reminderMinutes);
    console.log("[SIMPLE-REMINDER] Calculated reminder times:", reminderTimes.map(t => t.toISOString()));
    
    if (reminderTimes.length === 0) {
      console.warn("[SIMPLE-REMINDER] No future reminder times calculated, but proceeding with final delivery");
    }
    
    // Step 4: Clear existing reminders
    const { error: deleteError } = await supabase
      .from('reminder_schedule')
      .delete()
      .eq('message_id', params.messageId);
    
    if (deleteError) {
      console.error("[SIMPLE-REMINDER] Error clearing existing reminders:", deleteError);
    } else {
      console.log("[SIMPLE-REMINDER] Cleared existing reminders");
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
    
    // Always add final delivery at deadline
    reminderEntries.push({
      message_id: params.messageId,
      condition_id: params.conditionId,
      scheduled_at: deadline.toISOString(),
      reminder_type: 'final_delivery',
      status: 'pending',
      delivery_priority: 'critical',
      retry_strategy: 'aggressive'
    });
    
    console.log("[SIMPLE-REMINDER] Attempting to insert", reminderEntries.length, "reminder entries");
    
    const { data, error } = await supabase
      .from('reminder_schedule')
      .insert(reminderEntries)
      .select();
    
    if (error) {
      console.error("[SIMPLE-REMINDER] Error creating reminder schedule:", error);
      return false;
    }
    
    console.log("[SIMPLE-REMINDER] Successfully inserted reminder entries:", data?.length || 0);
    
    // Step 6: Verify the creation
    const verifiedCount = await verifyReminderCreation(params.messageId);
    
    if (verifiedCount === 0) {
      console.error("[SIMPLE-REMINDER] No reminders were found after creation - database issue!");
      return false;
    }
    
    console.log("[SIMPLE-REMINDER] Verification successful:", verifiedCount, "reminders created");
    
    // Step 7: Trigger immediate processing
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
      console.log("[SIMPLE-REMINDER] Triggered reminder processing");
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
