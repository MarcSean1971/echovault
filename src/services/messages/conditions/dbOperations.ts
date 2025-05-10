import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition, RecurringPattern, PanicTriggerConfig } from "@/types/message";
import { CreateConditionOptions } from "./types";
import { Json } from "@/types/supabase";

// Helper function to map database condition to application condition
export function mapDbConditionToMessageCondition(condition: any): MessageCondition {
  return {
    ...condition,
    // Add the fields that don't exist in the database but are used in the application
    triggered: !condition.active, // If not active, we consider it triggered for now
    delivered: !condition.active, // If not active, we consider it delivered for now
    // For recurring patterns, preserve the structure
    recurring_pattern: condition.recurring_pattern as RecurringPattern | null,
    // Map panic_config to panic_trigger_config for consistency in the application
    panic_trigger_config: condition.panic_config || undefined,
    // Make sure trigger_type is set to condition_type if not available
    trigger_type: condition.trigger_type || condition.condition_type,
    // Map additional fields
    unlock_delay_hours: condition.unlock_delay_hours || 0,
    expiry_hours: condition.expiry_hours || 0
  } as MessageCondition;
}

// Helper function to safely stringify objects for JSON storage
function safeJsonStringify(obj: any): Json {
  if (!obj) return null;
  
  try {
    // For objects with JSON circular references, etc.
    return JSON.parse(JSON.stringify(obj)) as Json;
  } catch (e) {
    console.error("Failed to convert object to JSON:", e);
    return null;
  }
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
    panicTriggerConfig,
    checkInCode
  } = options;

  const client = await getAuthClient();
  
  // Prepare data with proper type casting to avoid insertion errors
  const insertData = {
    message_id: messageId,
    condition_type: conditionType,
    trigger_type: conditionType, // Ensure both fields are set
    hours_threshold: hoursThreshold,
    minutes_threshold: minutesThreshold,
    trigger_date: triggerDate || null,
    recurring_pattern: safeJsonStringify(recurringPattern),
    confirmation_required: confirmationRequired,
    confirmations_received: 0,
    unlock_delay_hours: unlockDelayHours || 0,
    expiry_hours: expiryHours || 0,
    pin_code: pinCode || null,
    recipients: safeJsonStringify(recipients),
    secondary_condition_type: secondaryConditionType || null,
    secondary_trigger_date: secondaryTriggerDate || null,
    secondary_recurring_pattern: safeJsonStringify(secondaryRecurringPattern),
    reminder_hours: reminderHours || null,
    panic_config: safeJsonStringify(panicTriggerConfig),
    active: true,
    check_in_code: checkInCode || null
  };
  
  const { data, error } = await client
    .from("message_conditions")
    .insert(insertData)
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
  
  try {
    console.log(`[fetchConditionsFromDb] Fetching conditions for user: ${userId}`);
    
    // First, get all message IDs for this user
    const { data: messageData, error: messageError } = await client
      .from("messages")
      .select("id")
      .eq("user_id", userId);
    
    if (messageError) {
      console.error("[fetchConditionsFromDb] Error fetching messages:", messageError);
      throw new Error(messageError.message || "Failed to fetch messages");
    }
    
    // If no messages found, return empty array
    if (!messageData || messageData.length === 0) {
      console.log("[fetchConditionsFromDb] No messages found for user");
      return [];
    }
    
    // Extract message IDs
    const messageIds = messageData.map(msg => msg.id);
    console.log(`[fetchConditionsFromDb] Found ${messageIds.length} message IDs`);
    
    // Now fetch conditions based on these message IDs
    const { data, error } = await client
      .from("message_conditions")
      .select("*")
      .in("message_id", messageIds);

    if (error) {
      console.error("[fetchConditionsFromDb] Error fetching message conditions:", error);
      throw new Error(error.message || "Failed to fetch message conditions");
    }

    console.log(`[fetchConditionsFromDb] Successfully fetched ${data?.length || 0} conditions`);
    return (data || []).map(mapDbConditionToMessageCondition);
  } catch (error) {
    console.error("[fetchConditionsFromDb] Error:", error);
    throw error;
  }
}

export async function updateConditionInDb(
  conditionId: string,
  updates: Partial<MessageCondition>
): Promise<any> {
  const client = await getAuthClient();
  
  // Filter out properties that don't exist in the database and map field names
  const { triggered, delivered, panic_trigger_config, recurring_pattern, ...validUpdates } = updates;
  
  // Build database updates with proper JSON serialization
  const dbUpdates: Record<string, any> = {
    ...validUpdates,
    // Ensure check_in_code is properly handled (could be null)
    check_in_code: updates.check_in_code
  };
  
  // Convert complex objects to JSON
  if (panic_trigger_config !== undefined) {
    dbUpdates.panic_config = safeJsonStringify(panic_trigger_config);
  }
  
  if (recurring_pattern !== undefined) {
    dbUpdates.recurring_pattern = safeJsonStringify(recurring_pattern);
  }
  
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
    .select("*")
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
