
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createSuccessResponse, createErrorResponse } from "../shared/whatsapp-utils.ts";
import { createSupabaseAdmin } from "../shared/supabase-client.ts";

/**
 * Processes a check-in from WhatsApp and updates condition timestamps
 * CRITICAL FIX: Only update last_checked, never touch the active field
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CHECK-IN] Processing WhatsApp check-in request");
    
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return createErrorResponse({ message: "Invalid JSON in request body" }, 400);
    }
    
    const { userId, phoneNumber, method = "whatsapp" } = requestData;
    
    if (!userId) {
      return createErrorResponse({ message: "Missing required parameter: userId" }, 400);
    }
    
    console.log(`[CHECK-IN] Processing check-in for user ${userId} via ${method}`);
    
    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    
    // CRITICAL FIX: Only get active conditions, do NOT modify the active field
    const { data: conditionsData, error: conditionsError } = await supabase
      .from("message_conditions")
      .select("id, message_id, condition_type, hours_threshold, minutes_threshold, reminder_hours, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
      
    if (conditionsError) {
      throw new Error(`Error fetching conditions: ${conditionsError.message}`);
    }
    
    console.log(`[CHECK-IN] Found ${conditionsData?.length || 0} active conditions for user ${userId}`);
    
    // CRITICAL FIX: Only update last_checked timestamp, NEVER touch active field
    if (conditionsData && conditionsData.length > 0) {
      const conditionIds = conditionsData.map(c => c.id);
      
      console.log(`[CHECK-IN] CRITICAL: Only updating last_checked for conditions: ${conditionIds}`);
      
      // FIXED: Only update last_checked field, explicitly exclude active field
      const { error: updateError } = await supabase
        .from("message_conditions")
        .update({ last_checked: now })
        .in("id", conditionIds);
        
      if (updateError) {
        throw new Error(`Failed to update conditions: ${updateError.message}`);
      }
      
      console.log("[CHECK-IN] CONFIRMED: Successfully updated ONLY last_checked timestamps, active field untouched");
      
      // Regenerate reminder schedules for each updated condition
      console.log("[CHECK-IN] Regenerating reminder schedules after check-in");
      
      for (const condition of conditionsData) {
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
            
            // Filter out reminder times that would be in the past
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
      
      // Send confirmation using WhatsApp notification
      if (phoneNumber) {
        console.log(`[CHECK-IN] Sending confirmation to phone: ${phoneNumber}`);
        
        try {
          const { data: confirmationResult, error: confirmationError } = await supabase.functions.invoke("send-whatsapp-notification", {
            body: {
              to: phoneNumber,
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
      }
      
      console.log(`[CHECK-IN] FINAL STATUS: Conditions remain ACTIVE, only last_checked updated for ${conditionsData.length} conditions`);
    } else {
      console.log("[CHECK-IN] No active conditions found for user");
    }
    
    return createSuccessResponse({
      timestamp: now,
      method: method,
      conditions_updated: conditionsData?.length || 0,
      reminders_regenerated: true,
      critical_note: "Conditions remain ACTIVE, only timers reset"
    });
    
  } catch (error) {
    return createErrorResponse(error);
  }
});
