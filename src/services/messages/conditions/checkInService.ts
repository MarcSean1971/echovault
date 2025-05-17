
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateReminderSchedule } from "@/services/messages/reminderService";
import { toast } from "@/components/ui/use-toast";

/**
 * Perform a check-in for a message condition
 */
export async function performCheckIn(userId: string, source: string = "app") {
  try {
    console.log(`[performCheckIn] Processing check-in for user ${userId} from ${source}`);
    
    // Get user's check-in conditions
    const { data: conditions, error: conditionsError } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "regular_check_in", "inactivity_to_date"]);
    
    if (conditionsError) {
      throw new Error(`Error fetching conditions: ${conditionsError.message}`);
    }
    
    if (!conditions || conditions.length === 0) {
      console.log("[performCheckIn] No active conditions found for check-in");
      return {
        success: true,
        message: "No active conditions found that require check-ins",
        updatedConditions: 0
      };
    }
    
    console.log(`[performCheckIn] Found ${conditions.length} conditions to update`);
    
    // Update all check-in conditions with new timestamp
    const now = new Date().toISOString();
    const updates = [];
    const reminderSchedules = [];
    const reminderResults = [];
    let schedulesCreated = 0;
    let scheduleErrors = 0;
    
    for (const condition of conditions) {
      console.log(`[performCheckIn] Processing condition ${condition.id} for message ${condition.message_id}`);
      
      // Update condition with new last_checked timestamp
      const { error: updateError } = await supabase
        .from("message_conditions")
        .update({ last_checked: now })
        .eq("id", condition.id);
        
      if (updateError) {
        console.error(`[performCheckIn] Error updating condition ${condition.id}:`, updateError);
        scheduleErrors++;
        continue; // Continue with other conditions even if one fails
      }
      
      // Parse reminder minutes from the condition
      let reminderMinutes: number[] = [];
      if (condition.reminder_hours && Array.isArray(condition.reminder_hours)) {
        reminderMinutes = condition.reminder_hours.map(hours => hours * 60);
      }
      
      // If no reminder hours are specified, use default reminder minutes at 80% of threshold
      if (reminderMinutes.length === 0) {
        const thresholdMinutes = 
          (condition.hours_threshold || 0) * 60 + (condition.minutes_threshold || 0);
        
        if (thresholdMinutes > 0) {
          // Set reminder at 80% of the threshold time
          reminderMinutes = [Math.floor(thresholdMinutes * 0.8)];
        } else {
          // Default to 24 hours
          reminderMinutes = [24 * 60];
        }
      }
      
      console.log(
        `[performCheckIn] Scheduling reminders for condition ${condition.id}, ` +
        `message ${condition.message_id} with reminder minutes:`, reminderMinutes
      );
      
      // Create new reminder schedule (this will also mark old ones as obsolete)
      try {
        const result = await createOrUpdateReminderSchedule({
          messageId: condition.message_id,
          conditionId: condition.id,
          conditionType: condition.condition_type,
          triggerDate: null,
          reminderMinutes,
          lastChecked: now,
          hoursThreshold: condition.hours_threshold,
          minutesThreshold: condition.minutes_threshold || 0
        });
        
        reminderResults.push({
          messageId: condition.message_id,
          conditionId: condition.id,
          success: result
        });
        
        if (result) {
          schedulesCreated++;
        } else {
          scheduleErrors++;
        }
        
        console.log(`[performCheckIn] Reminder schedule ${result ? 'created' : 'failed'} for message ${condition.message_id}`);
      } catch (scheduleError) {
        console.error(`[performCheckIn] Error creating reminder schedule for message ${condition.message_id}:`, scheduleError);
        scheduleErrors++;
        reminderResults.push({
          messageId: condition.message_id,
          conditionId: condition.id,
          success: false,
          error: scheduleError
        });
      }
    }
    
    console.log(`[performCheckIn] Successfully updated ${conditions.length} conditions`);
    console.log(`[performCheckIn] Created ${schedulesCreated} reminder schedules with ${scheduleErrors} errors`);
    
    // If all schedules failed, show a warning
    if (scheduleErrors > 0 && schedulesCreated === 0) {
      toast({
        title: "Check-in Warning",
        description: "Your check-in was recorded but the reminder schedule could not be updated.",
        variant: "destructive", // Changed from "warning" to "destructive" as it's one of the allowed variants
        duration: 5000
      });
    }
    
    // Dispatch a global event to notify any listeners about the condition update
    try {
      if (typeof window !== 'undefined') {
        const eventDetails = {
          updatedAt: now,
          reminderResults: reminderResults,
          schedulesCreated,
          scheduleErrors,
          triggerValue: Date.now() // Add unique value to ensure events are distinct
        };
        
        console.log('[performCheckIn] Dispatching conditions-updated event with details:', eventDetails);
        
        window.dispatchEvent(new CustomEvent('conditions-updated', {
          detail: eventDetails
        }));
        
        // Dispatch a second event after a short delay to ensure listeners have time to register
        setTimeout(() => {
          console.log('[performCheckIn] Dispatching delayed conditions-updated event');
          window.dispatchEvent(new CustomEvent('conditions-updated', {
            detail: {
              ...eventDetails,
              triggerValue: Date.now() + 1, // Different value to ensure it's treated as a new event
              delayed: true
            }
          }));
        }, 1000);
      }
    } catch (eventError) {
      console.warn('[performCheckIn] Failed to dispatch conditions-updated event:', eventError);
    }
    
    return {
      success: true,
      message: `Successfully checked in for ${conditions.length} conditions.`,
      updatedConditions: conditions.length,
      schedulesCreated,
      scheduleErrors,
      reminderResults: reminderResults
    };
  } catch (error: any) {
    console.error("[performCheckIn] Error during check-in:", error);
    throw new Error(`Check-in failed: ${error.message}`);
  }
}

/**
 * Calculate the next check-in deadline for a condition
 */
export function getNextCheckInDeadline(condition: any): Date | null {
  if (!condition || !condition.last_checked) return null;
  
  try {
    // Calculate deadline based on hours and minutes threshold
    const lastChecked = new Date(condition.last_checked);
    const hoursThreshold = condition.hours_threshold || 0;
    const minutesThreshold = condition.minutes_threshold || 0;
    
    // Calculate total milliseconds for threshold
    const thresholdMs = (hoursThreshold * 60 * 60 + minutesThreshold * 60) * 1000;
    
    // Calculate deadline by adding threshold to last checked time
    const deadline = new Date(lastChecked.getTime() + thresholdMs);
    
    return deadline;
  } catch (error) {
    console.error('[getNextCheckInDeadline] Error calculating deadline:', error);
    return null;
  }
}
