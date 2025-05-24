
import { supabaseClient } from "./supabase-client.ts";
import { createSuccessResponse, createErrorResponse } from "../shared/utils/response-formatters.ts";

/**
 * Fix stuck reminders and trigger overdue deliveries
 */
export async function fixStuckReminders(debug: boolean = false): Promise<any> {
  try {
    const supabase = supabaseClient();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (debug) {
      console.log(`[FIX-STUCK] Starting stuck reminder fix at ${now.toISOString()}`);
    }
    
    // Step 1: Find all stuck reminders (processing for more than 5 minutes)
    const { data: stuckReminders, error: findError } = await supabase
      .from('reminder_schedule')
      .select('*')
      .eq('status', 'processing')
      .lt('last_attempt_at', fiveMinutesAgo.toISOString());
    
    if (findError) {
      console.error("[FIX-STUCK] Error finding stuck reminders:", findError);
      throw findError;
    }
    
    let resetCount = 0;
    let triggeredCount = 0;
    
    if (stuckReminders && stuckReminders.length > 0) {
      if (debug) {
        console.log(`[FIX-STUCK] Found ${stuckReminders.length} stuck reminders`);
      }
      
      // Step 2: Reset stuck reminders to pending
      const { error: resetError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'pending',
          retry_count: 0,
          updated_at: now.toISOString()
        })
        .in('id', stuckReminders.map(r => r.id));
      
      if (resetError) {
        console.error("[FIX-STUCK] Error resetting stuck reminders:", resetError);
        throw resetError;
      }
      
      resetCount = stuckReminders.length;
      
      // Step 3: Trigger immediate processing for overdue messages
      const overdueMessages = new Set(
        stuckReminders
          .filter(r => new Date(r.scheduled_at) <= now)
          .map(r => r.message_id)
      );
      
      for (const messageId of overdueMessages) {
        try {
          if (debug) {
            console.log(`[FIX-STUCK] Triggering overdue delivery for message ${messageId}`);
          }
          
          await supabase.functions.invoke("send-message-notifications", {
            body: {
              messageId: messageId,
              debug: true,
              forceSend: true,
              isEmergency: true,
              source: "fix-stuck-overdue"
            }
          });
          
          triggeredCount++;
        } catch (triggerError) {
          console.error(`[FIX-STUCK] Error triggering delivery for ${messageId}:`, triggerError);
        }
      }
    }
    
    // Step 4: Find and handle any messages with passed deadlines
    const { data: overdueConditions, error: overdueError } = await supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        condition_type,
        hours_threshold,
        minutes_threshold,
        last_checked,
        created_at,
        trigger_date
      `)
      .eq('active', true)
      .in('condition_type', ['no_check_in', 'scheduled', 'inactivity_to_date']);
    
    if (!overdueError && overdueConditions) {
      for (const condition of overdueConditions) {
        let deadlineDate: Date | null = null;
        
        if (condition.condition_type === 'scheduled' && condition.trigger_date) {
          deadlineDate = new Date(condition.trigger_date);
        } else if (condition.hours_threshold) {
          const baseTime = condition.last_checked ? new Date(condition.last_checked) : new Date(condition.created_at);
          const hoursInMs = condition.hours_threshold * 60 * 60 * 1000;
          const minutesInMs = (condition.minutes_threshold || 0) * 60 * 1000;
          deadlineDate = new Date(baseTime.getTime() + hoursInMs + minutesInMs);
        }
        
        // If deadline has passed and no recent delivery, trigger emergency delivery
        if (deadlineDate && now >= deadlineDate) {
          if (debug) {
            console.log(`[FIX-STUCK] Found overdue condition ${condition.id}, deadline was ${deadlineDate.toISOString()}`);
          }
          
          try {
            // Check if this was already delivered recently
            const { data: recentDelivery } = await supabase
              .from('delivered_messages')
              .select('id')
              .eq('message_id', condition.message_id)
              .gte('delivered_at', deadlineDate.toISOString())
              .limit(1);
            
            if (!recentDelivery || recentDelivery.length === 0) {
              // Disarm the condition first
              await supabase
                .from('message_conditions')
                .update({ active: false })
                .eq('id', condition.id);
              
              // Trigger emergency delivery
              await supabase.functions.invoke("send-message-notifications", {
                body: {
                  messageId: condition.message_id,
                  debug: true,
                  forceSend: true,
                  isEmergency: true,
                  source: "fix-stuck-deadline-recovery"
                }
              });
              
              triggeredCount++;
              
              if (debug) {
                console.log(`[FIX-STUCK] Triggered emergency delivery for overdue message ${condition.message_id}`);
              }
            }
          } catch (emergencyError) {
            console.error(`[FIX-STUCK] Error with emergency delivery for ${condition.message_id}:`, emergencyError);
          }
        }
      }
    }
    
    if (debug) {
      console.log(`[FIX-STUCK] Fix complete - Reset: ${resetCount}, Triggered: ${triggeredCount}`);
    }
    
    return {
      success: true,
      resetCount,
      triggeredCount,
      timestamp: now.toISOString()
    };
    
  } catch (error) {
    console.error("[FIX-STUCK] Error in fixStuckReminders:", error);
    throw error;
  }
}
