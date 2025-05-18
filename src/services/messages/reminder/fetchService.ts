
/**
 * Service functions for fetching reminder data
 */
import { supabase } from "@/integrations/supabase/client";
import { Reminder } from "./types";

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
