
/**
 * Core reminder schedule generation functions
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { markRemindersAsObsolete } from '../reminderUtils';

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
      console.error(`[REMINDER-GENERATOR] Cannot generate reminder schedule for message ${messageId} - no trigger date provided`);
      return false;
    }
    
    if (!reminderMinutes || reminderMinutes.length === 0) {
      console.error(`[REMINDER-GENERATOR] Cannot generate reminder schedule for message ${messageId} - no reminder minutes provided`);
      return false;
    }
    
    console.log(`[REMINDER-GENERATOR] Generating reminder schedule for message ${messageId}, condition ${conditionId}`);
    console.log(`[REMINDER-GENERATOR] Trigger date: ${triggerDate.toISOString()}`);
    console.log(`[REMINDER-GENERATOR] Reminder minutes (count: ${reminderMinutes.length}): ${JSON.stringify(reminderMinutes)}`);
    
    // Mark existing reminders as obsolete first
    const markResult = await markRemindersAsObsolete(messageId, conditionId);
    if (!markResult) {
      console.warn(`[REMINDER-GENERATOR] Warning: Failed to mark existing reminders as obsolete for message ${messageId}`);
      // Continue despite warning, as we still want to try creating new reminders
    }
    
    // Generate reminder timestamps - ensure we iterate through all reminder minutes
    const scheduleEntries = reminderMinutes.map(minutes => {
      const scheduledAt = new Date(triggerDate.getTime() - (minutes * 60 * 1000));
      
      console.log(`[REMINDER-GENERATOR] Creating reminder for ${minutes} minutes before deadline at ${scheduledAt.toISOString()}`);
      
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
    
    console.log(`[REMINDER-GENERATOR] Generated ${scheduleEntries.length} schedule entries for message ${messageId}`);
    
    return await storeReminderSchedule(messageId, conditionId, scheduleEntries);
  } catch (error) {
    console.error("[REMINDER-GENERATOR] Error in generateReminderSchedule:", error);
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
 * Store reminder schedule entries in the database
 */
async function storeReminderSchedule(
  messageId: string, 
  conditionId: string, 
  scheduleEntries: any[]
): Promise<boolean> {
  try {
    // Insert schedule entries with conflict handling for idempotency
    const { data, error } = await supabase
      .from('reminder_schedule')
      .upsert(scheduleEntries, {
        onConflict: 'message_id,condition_id,scheduled_at,reminder_type',
        ignoreDuplicates: false // Change to false to get error feedback if insert fails
      });
    
    if (error) {
      console.error("[REMINDER-GENERATOR] Error storing reminder schedule:", error);
      
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
    
    console.log(`[REMINDER-GENERATOR] Successfully stored reminder schedule for message ${messageId}`);
    
    // Verify that reminders were actually created by checking the database
    try {
      const { count, error: countError } = await supabase
        .from('reminder_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', messageId)
        .eq('condition_id', conditionId)
        .eq('status', 'pending');
        
      if (countError) {
        console.error("[REMINDER-GENERATOR] Error verifying reminder count:", countError);
      } else {
        console.log(`[REMINDER-GENERATOR] Verified ${count} pending reminders exist for message ${messageId}, condition ${conditionId}`);
        
        if (count === 0) {
          console.error("[REMINDER-GENERATOR] No reminders were created despite no error! This might indicate a constraint issue.");
          toast({
            title: "Reminder Warning",
            description: "No reminders were created. Please check system settings.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
    } catch (verifyError) {
      console.error("[REMINDER-GENERATOR] Error during verification:", verifyError);
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-GENERATOR] Error in storeReminderSchedule:", error);
    return false;
  }
}
