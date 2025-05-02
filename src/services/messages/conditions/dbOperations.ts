
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition, RecurringPattern } from "@/types/message";
import { CreateConditionOptions } from "./types";

// Helper function to map database condition to application condition
export function mapDbConditionToMessageCondition(condition: any): MessageCondition {
  return {
    ...condition,
    // Add the fields that don't exist in the database but are used in the application
    triggered: !condition.active, // If not active, we consider it triggered for now
    delivered: !condition.active, // If not active, we consider it delivered for now
    // For recurring patterns, preserve the structure
    recurring_pattern: condition.recurring_pattern as RecurringPattern | null,
    // Map additional fields
    unlock_delay_hours: condition.unlock_delay_hours || 0,
    expiry_hours: condition.expiry_hours || 0
  } as MessageCondition;
}

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
    panicTriggerConfig
  } = options;

  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .insert({
      message_id: messageId,
      condition_type: conditionType,
      hours_threshold: hoursThreshold,
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
      active: true
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating message condition:", error);
    throw new Error(error.message || "Failed to create message condition");
  }

  return data;
}

export async function fetchConditionsFromDb(userId: string): Promise<MessageCondition[]> {
  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .select("*, messages!inner(*)")
    .eq("messages.user_id", userId);

  if (error) {
    console.error("Error fetching message conditions:", error);
    throw new Error(error.message || "Failed to fetch message conditions");
  }

  return data.map(mapDbConditionToMessageCondition);
}

export async function updateConditionInDb(
  conditionId: string,
  updates: Partial<MessageCondition>
): Promise<any> {
  const client = await getAuthClient();
  
  // Filter out properties that don't exist in the database
  const { triggered, delivered, ...validUpdates } = updates;
  
  const { data, error } = await client
    .from("message_conditions")
    .update(validUpdates)
    .eq("id", conditionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating message condition:", error);
    throw new Error(error.message || "Failed to update message condition");
  }

  return data;
}

export async function deleteConditionFromDb(conditionId: string): Promise<void> {
  const client = await getAuthClient();
  
  const { error } = await client
    .from("message_conditions")
    .delete()
    .eq("id", conditionId);

  if (error) {
    console.error("Error deleting message condition:", error);
    throw new Error(error.message || "Failed to delete message condition");
  }
}

export async function getConditionByMessageId(messageId: string): Promise<any> {
  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .select("*, messages!inner(*)")
    .eq("message_id", messageId)
    .single();
    
  if (error) {
    console.error("Error getting message condition:", error);
    throw new Error("Message not found or condition doesn't exist");
  }
  
  return data;
}

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
