
import { getAuthClient } from "@/lib/supabaseClient";
import { CreateConditionOptions } from "../types";
import { mapDbConditionToMessageCondition } from "../helpers/map-helpers";

/**
 * Creates a new message condition in the database
 */
export async function createConditionInDb(
  messageId: string,
  conditionType: string,
  options: CreateConditionOptions
): Promise<any> {
  const {
    hoursThreshold = 72,
    minutesThreshold = 0,
    confirmationRequired = 0,
    triggerDate,
    recurringPattern,
    recipients,
    pinCode,
    unlockDelayHours,
    expiryHours,
    secondaryConditionType,
    secondaryTriggerDate,
    secondaryRecurringPattern,
    reminderHours = [24], // Default 24-hour reminder
    panicTriggerConfig,
    checkInCode
  } = options;

  // Ensure hours_threshold is never 0 when minutes are set and is always an integer
  let finalHoursThreshold = hoursThreshold;
  if (finalHoursThreshold === 0 && minutesThreshold > 0) {
    // Convert minutes to hours with one decimal point precision for calculation
    const rawHoursValue = parseFloat((minutesThreshold / 60).toFixed(1));
    
    // For database storage, we need an integer - using Math.ceil to ensure we never round down to zero
    finalHoursThreshold = Math.ceil(rawHoursValue);
    
    console.log(`[createConditionInDb] Converted ${minutesThreshold} minutes to ${rawHoursValue} hours (stored as ${finalHoursThreshold})`);
  }

  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .insert({
      message_id: messageId,
      condition_type: conditionType,
      hours_threshold: finalHoursThreshold, // This is now guaranteed to be an integer
      minutes_threshold: minutesThreshold,
      trigger_date: triggerDate || null,
      recurring_pattern: recurringPattern || null,
      confirmation_required: confirmationRequired,
      confirmations_received: 0,
      unlock_delay_hours: unlockDelayHours || 0,
      expiry_hours: expiryHours || 0,
      pin_code: pinCode || null,
      recipients: recipients,
      secondary_condition_type: secondaryConditionType || null,
      secondary_trigger_date: secondaryTriggerDate || null,
      secondary_recurring_pattern: secondaryRecurringPattern || null,
      reminder_hours: reminderHours || null,
      panic_config: panicTriggerConfig || null,
      active: true,
      check_in_code: checkInCode || null
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating message condition:", error);
    throw new Error(error.message || "Failed to create message condition");
  }

  return data;
}
