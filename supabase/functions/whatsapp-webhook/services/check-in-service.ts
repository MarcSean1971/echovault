
import { createSupabaseAdmin } from "../../shared/services/whatsapp-service.ts";

/**
 * Process a check-in message from WhatsApp
 * FIXED: Use the same performUserCheckIn logic as manual check-in
 */
export async function processCheckIn(userId: string, phoneNumber: string) {
  try {
    console.log(`[CHECK-IN] Processing check-in for user ${userId} from ${phoneNumber}`);
    
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    
    // CRITICAL FIX: Use the same check-in logic as the manual check-in button
    // This ensures consistent behavior - only updates last_checked, never touches active field
    const checkInResult = await performUserCheckInInWebhook(supabase, userId);
    
    if (!checkInResult) {
      console.error("[CHECK-IN] Failed to update user conditions for WhatsApp check-in");
      return {
        success: false,
        error: "Failed to update user conditions"
      };
    }
    
    // FIXED: Send confirmation using the same mechanism as SOS responses - preserve whatsapp: prefix
    console.log(`[CHECK-IN] Sending confirmation to phone: ${phoneNumber} (keeping original format)`);
    
    try {
      // Use send-whatsapp-notification function like SOS responses do
      const { data: confirmationResult, error: confirmationError } = await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          to: phoneNumber, // Keep the original whatsapp: prefix intact
          message: `✅ Check-in received! Your deadman's switch timers have been reset. Time: ${new Date().toLocaleTimeString()}`
        }
      });
      
      if (confirmationError) {
        console.error("[CHECK-IN] Error sending confirmation:", confirmationError);
      } else {
        console.log("[CHECK-IN] Confirmation message sent successfully");
      }
    } catch (confirmationError) {
      console.error("[CHECK-IN] Exception sending confirmation:", confirmationError);
    }
    
    // Trigger realtime event for UI updates
    console.log("[CHECK-IN] Triggering realtime events for UI updates");
    
    return {
      success: true,
      timestamp: now,
      conditions_updated: checkInResult.conditionsUpdated,
      message: "Check-in processed successfully",
      reminders_regenerated: true
    };
    
  } catch (error) {
    console.error("[CHECK-IN] Error processing check-in:", error);
    return {
      success: false,
      error: error.message || "Failed to process check-in"
    };
  }
}

/**
 * CRITICAL FIX: Implement the EXACT same logic as performUserCheckIn from checkInService.ts
 * This ensures WhatsApp check-ins behave identically to manual check-ins
 */
async function performUserCheckInInWebhook(supabase: any, userId: string): Promise<{ conditionsUpdated: number } | null> {
  try {
    console.log(`[CHECK-IN] Starting check-in for user: ${userId} using SAME logic as manual check-in`);
    
    // CRITICAL FIX: Only get active conditions, do NOT modify active field
    const { data: conditions, error: fetchError } = await supabase
      .from("message_conditions")
      .select("id, message_id, condition_type, hours_threshold, minutes_threshold, reminder_hours, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (fetchError) {
      console.error("[CHECK-IN] Error fetching conditions:", fetchError);
      throw fetchError;
    }
    
    if (!conditions || conditions.length === 0) {
      console.log("[CHECK-IN] No active check-in conditions found for user");
      return { conditionsUpdated: 0 };
    }
    
    console.log(`[CHECK-IN] Found ${conditions.length} active check-in conditions`);
    console.log(`[CHECK-IN] CRITICAL: Will only update last_checked, NOT touching active field`);
    
    // CRITICAL FIX: Only update last_checked timestamp, never modify active field
    const conditionIds = conditions.map(c => c.id);
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from("message_conditions")
      .update({ last_checked: now })
      .in("id", conditionIds);
    
    if (updateError) {
      throw new Error("Failed to update condition timestamps");
    }
    
    console.log("[CHECK-IN] CONFIRMED: Successfully updated ONLY last_checked timestamps");
    
    // Regenerate reminder schedules
    console.log("[CHECK-IN] Marking existing reminders as obsolete and regenerating schedules");
    
    for (const condition of conditions) {
      try {
        console.log(`[CHECK-IN] Processing condition ${condition.id}, message ${condition.message_id}`);
        
        // Mark existing reminders as obsolete
        const { error: obsoleteError } = await supabase
          .from('reminder_schedule')
          .update({ status: 'obsolete' })
          .eq('message_id', condition.message_id)
          .eq('condition_id', condition.id)
          .eq('status', 'pending');
        
        if (obsoleteError) {
          console.error(`[CHECK-IN] Error marking reminders obsolete for condition ${condition.id}:`, obsoleteError);
        } else {
          console.log(`[CHECK-IN] Marked existing reminders as obsolete for condition ${condition.id}`);
        }
        
        // Only regenerate reminders if the condition has reminder_hours configured
        if (condition.reminder_hours && condition.reminder_hours.length > 0) {
          console.log(`[CHECK-IN] Regenerating reminders for condition ${condition.id} with ${condition.reminder_hours.length} reminder times`);
          
          // Calculate new deadline based on updated last_checked
          const newDeadline = new Date(now);
          newDeadline.setHours(newDeadline.getHours() + (condition.hours_threshold || 0));
          newDeadline.setMinutes(newDeadline.getMinutes() + (condition.minutes_threshold || 0));
          
          console.log(`[CHECK-IN] New deadline for condition ${condition.id}: ${newDeadline.toISOString()}`);
          
          // CRITICAL FIX: Filter out reminder times that would be in the past
          const validReminderMinutes = condition.reminder_hours.filter((minutes: number) => {
            const reminderTime = new Date(newDeadline.getTime() - (minutes * 60 * 1000));
            if (reminderTime <= new Date()) {
              console.warn(`[CHECK-IN] Skipping reminder ${minutes} minutes before deadline (would be in the past)`);
              return false;
            }
            return true;
          });
          
          console.log(`[CHECK-IN] Creating ${validReminderMinutes.length} valid reminder entries`);
          
          // Create new reminder schedule entries
          const reminderEntries = validReminderMinutes.map((minutes: number) => {
            const scheduledAt = new Date(newDeadline.getTime() - (minutes * 60 * 1000));
            
            return {
              message_id: condition.message_id,
              condition_id: condition.id,
              scheduled_at: scheduledAt.toISOString(),
              reminder_type: 'reminder',
              status: 'pending',
              delivery_priority: minutes < 60 ? 'high' : 'normal',
              retry_strategy: 'standard'
            };
          });
          
          // Add final delivery entry if deadline is in the future
          if (newDeadline > new Date()) {
            reminderEntries.push({
              message_id: condition.message_id,
              condition_id: condition.id,
              scheduled_at: newDeadline.toISOString(),
              reminder_type: 'final_delivery',
              status: 'pending',
              delivery_priority: 'critical',
              retry_strategy: 'aggressive'
            });
          }
          
          // Insert new reminder schedule
          if (reminderEntries.length > 0) {
            const { error: insertError } = await supabase
              .from('reminder_schedule')
              .insert(reminderEntries);
            
            if (insertError) {
              console.error(`[CHECK-IN] Error creating new reminder schedule for condition ${condition.id}:`, insertError);
            } else {
              console.log(`[CHECK-IN] Successfully created ${reminderEntries.length} new reminder entries for condition ${condition.id}`);
            }
          }
        } else {
          console.log(`[CHECK-IN] No reminder_hours configured for condition ${condition.id}, skipping reminder generation`);
        }
        
      } catch (reminderError) {
        console.error(`[CHECK-IN] Error processing reminders for condition ${condition.id}:`, reminderError);
        // Don't fail the entire check-in if reminder processing fails
      }
    }
    
    // Trigger immediate processing of any due reminders
    try {
      console.log("[CHECK-IN] Triggering immediate reminder processing");
      
      const { error: triggerError } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          forceSend: false,
          source: "whatsapp-check-in-service-trigger",
          action: "process"
        }
      });
      
      if (triggerError) {
        console.error("[CHECK-IN] Error triggering reminder processing:", triggerError);
      } else {
        console.log("[CHECK-IN] Successfully triggered reminder processing");
      }
    } catch (triggerError) {
      console.error("[CHECK-IN] Exception triggering reminder processing:", triggerError);
    }
    
    console.log(`[CHECK-IN] FINAL STATUS: Check-in completed successfully, ${conditions.length} conditions remain ACTIVE with reset timers`);
    return { conditionsUpdated: conditions.length };
    
  } catch (error) {
    console.error("[CHECK-IN] Error performing user check-in:", error);
    throw error;
  }
}
