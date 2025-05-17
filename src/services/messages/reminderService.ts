
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { generateReminderSchedule } from "@/utils/reminderScheduler";

// Define the Reminder type that needs to be exported
export interface Reminder {
  id: string;
  message_id: string;
  condition_id: string;
  sent_at: string;
  deadline: string;
  scheduled_for?: string | null;
  user_id?: string;
}

interface ReminderScheduleParams {
  messageId: string;
  conditionId: string;
  conditionType: string;
  triggerDate: string | null;
  reminderMinutes: number[];
  lastChecked: string | null;
  hoursThreshold?: number;
  minutesThreshold?: number;
}

/**
 * Create or update reminder schedule - uses upsert with the unique constraint
 * Updated to properly handle RLS security constraints
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Creating or updating reminder schedule for:", params);
    
    // Mark existing reminders as obsolete first (safety measure)
    await markExistingRemindersObsolete(params.messageId, params.conditionId);
    
    // Calculate scheduled times
    const scheduleTimes = calculateScheduleTimes(params);
    
    if (scheduleTimes.length === 0) {
      console.warn("[REMINDER-SERVICE] No schedule times generated");
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Generated ${scheduleTimes.length} schedule entries`);
    
    // Create reminder entries with proper conflict handling using our unique constraint
    const { data, error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleTimes, {
        onConflict: 'message_id,condition_id,scheduled_at,reminder_type',
        ignoreDuplicates: false
      });
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.error("[REMINDER-SERVICE] Permission denied creating reminder schedule - user likely doesn't own this message");
        toast({
          title: "Permission Error",
          description: "You don't have permission to create reminders for this message.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        console.error("[REMINDER-SERVICE] Error creating reminder schedule:", error);
      }
      return false;
    }
    
    console.log(`[REMINDER-SERVICE] Successfully created ${scheduleTimes.length} reminder schedule entries`);
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in createOrUpdateReminderSchedule:", error);
    return false;
  }
}

/**
 * Mark existing reminders as obsolete
 * Updated to handle RLS permissions
 */
async function markExistingRemindersObsolete(messageId: string, conditionId: string): Promise<boolean> {
  try {
    console.log(`[REMINDER-SERVICE] Marking existing reminders as obsolete for message ${messageId}, condition ${conditionId}`);
    
    const { error } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId)
      .eq('condition_id', conditionId);
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SERVICE] Permission denied marking reminders as obsolete - user likely doesn't own this message");
      } else {
        console.error("[REMINDER-SERVICE] Error marking reminders as obsolete:", error);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in markExistingRemindersObsolete:", error);
    return false;
  }
}

/**
 * Calculate reminder schedule times based on params
 */
function calculateScheduleTimes(params: ReminderScheduleParams): any[] {
  const { messageId, conditionId, conditionType, triggerDate, reminderMinutes, lastChecked, hoursThreshold, minutesThreshold } = params;
  
  // For check-in conditions, we need to create a virtual deadline
  let effectiveDeadline: Date | null = null;
  if (['no_check_in', 'regular_check_in', 'inactivity_to_date'].includes(conditionType) && lastChecked && (hoursThreshold || minutesThreshold)) {
    const lastCheckedDate = new Date(lastChecked);
    effectiveDeadline = new Date(lastCheckedDate);
    
    if (hoursThreshold) {
      effectiveDeadline.setHours(effectiveDeadline.getHours() + hoursThreshold);
    }
    
    if (minutesThreshold) {
      effectiveDeadline.setMinutes(effectiveDeadline.getMinutes() + minutesThreshold);
    }
    
    console.log(`[REMINDER-SERVICE] Calculated virtual deadline for ${conditionType}: ${effectiveDeadline.toISOString()}`);
  } else if (triggerDate) {
    effectiveDeadline = new Date(triggerDate);
    console.log(`[REMINDER-SERVICE] Using explicit trigger date: ${effectiveDeadline.toISOString()}`);
  } else {
    console.warn("[REMINDER-SERVICE] No deadline could be determined");
    return [];
  }
  
  if (!effectiveDeadline) {
    return [];
  }
  
  // Generate schedule entries
  const scheduleEntries = reminderMinutes.map(minutes => {
    const scheduledAt = new Date(effectiveDeadline!.getTime() - (minutes * 60 * 1000));
    
    return {
      message_id: messageId,
      condition_id: conditionId,
      scheduled_at: scheduledAt.toISOString(),
      reminder_type: 'reminder',
      status: 'pending',
      delivery_priority: minutes < 60 ? 'high' : 'normal', // High priority for reminders less than an hour before deadline
      retry_strategy: 'standard'
    };
  });
  
  // Add final delivery entry
  scheduleEntries.push({
    message_id: messageId,
    condition_id: conditionId,
    scheduled_at: effectiveDeadline.toISOString(),
    reminder_type: 'final_delivery',
    status: 'pending',
    delivery_priority: 'critical',
    retry_strategy: 'aggressive'
  });
  
  return scheduleEntries;
}

/**
 * Get reminder schedule for a message
 * Updated to handle RLS permissions
 */
export async function getReminderScheduleForMessage(messageId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('*')
      .eq('message_id', messageId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SERVICE] Permission denied fetching reminder schedule - user likely doesn't own this message");
      } else {
        console.error("[REMINDER-SERVICE] Error fetching reminder schedule:", error);
      }
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in getReminderScheduleForMessage:", error);
    return [];
  }
}

/**
 * Get reminder history for a specific message
 * Updated to handle RLS permissions
 */
export async function getReminderHistory(messageId: string): Promise<Reminder[]> {
  try {
    const { data, error } = await supabase
      .from('sent_reminders')
      .select('*')
      .eq('message_id', messageId)
      .order('sent_at', { ascending: false });
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SERVICE] Permission denied fetching reminder history - user likely doesn't own this message");
      } else {
        console.error("[REMINDER-SERVICE] Error fetching reminder history:", error);
      }
      return [];
    }
    
    return data as Reminder[] || [];
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in getReminderHistory:", error);
    return [];
  }
}
