
import { supabase } from "@/integrations/supabase/client";
import { MessageCondition } from "@/types/message";
import { getAuthClient } from "@/lib/supabaseClient";

/**
 * Updates an existing message condition in the database
 */
export async function updateConditionInDb(
  conditionId: string,
  updates: Partial<MessageCondition>
): Promise<any> {
  const client = await getAuthClient();
  
  // Filter out properties that don't exist in the database and map field names
  const { triggered, delivered, panic_trigger_config, hours_threshold, minutes_threshold, ...restUpdates } = updates;
  
  // No special handling needed for hours_threshold - we can now use it directly
  const finalHoursThreshold = hours_threshold;
  
  // Map panic_trigger_config to panic_config for database updates
  const dbUpdates = {
    ...restUpdates,
    // Include hours_threshold if it was in the original updates
    ...(hours_threshold !== undefined && { hours_threshold: finalHoursThreshold }),
    // Add minutes_threshold back if it existed
    ...(minutes_threshold !== undefined && { minutes_threshold }),
    // If panic_trigger_config exists in the updates, map it to panic_config
    ...(panic_trigger_config !== undefined && { panic_config: panic_trigger_config }),
    // Ensure check_in_code is properly handled (could be null)
    check_in_code: updates.check_in_code
  };
  
  const { data, error } = await client
    .from("message_conditions")
    .update(dbUpdates)
    .eq("id", conditionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating message condition:", error);
    throw new Error(error.message || "Failed to update message condition");
  }

  return data;
}

/**
 * Updates the last_checked timestamp for multiple conditions
 */
export async function updateConditionsLastChecked(conditionIds: string[], timestamp: string): Promise<void> {
  if (!conditionIds.length) return;
  
  const client = await getAuthClient();
  
  const { error } = await client
    .from("message_conditions")
    .update({ 
      last_checked: timestamp
    })
    .in("id", conditionIds);
    
  if (error) {
    throw new Error(error.message || "Failed to update conditions");
  }
}
