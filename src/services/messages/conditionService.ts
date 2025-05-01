
import { getAuthClient } from "@/lib/supabaseClient";
import { MessageCondition, TriggerType } from "@/types/message";

interface CreateConditionOptions {
  hoursThreshold?: number;
  confirmationRequired?: number;
  triggerDate?: string;
  recurringPattern?: any;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  pinCode?: string;
  unlockDelayHours?: number;
  expiryHours?: number;
}

export async function createMessageCondition(
  messageId: string,
  conditionType: TriggerType,
  options: CreateConditionOptions
): Promise<MessageCondition> {
  const {
    hoursThreshold = 72,
    confirmationRequired = 0,
    triggerDate,
    recurringPattern,
    recipients,
    pinCode,
    unlockDelayHours,
    expiryHours,
  } = options;

  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .insert({
      message_id: messageId,
      condition_type: conditionType,
      hours_threshold: hoursThreshold,
      trigger_date: triggerDate || null,
      recurring_pattern: recurringPattern || null,
      confirmation_required: confirmationRequired,
      confirmations_received: 0,
      unlock_delay_hours: unlockDelayHours || 0,
      expiry_hours: expiryHours || 0,
      pin_code: pinCode || null,
      recipients: recipients,
      active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating message condition:", error);
    throw new Error(error.message || "Failed to create message condition");
  }

  return data as MessageCondition;
}

export async function fetchMessageConditions(userId: string): Promise<MessageCondition[]> {
  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .select("*, messages!inner(*)")
    .eq("messages.user_id", userId);

  if (error) {
    console.error("Error fetching message conditions:", error);
    throw new Error(error.message || "Failed to fetch message conditions");
  }

  return data.map((condition: any) => {
    // Fix field names to match our expected types
    return {
      id: condition.id,
      message_id: condition.message_id,
      condition_type: condition.condition_type,
      hours_threshold: condition.hours_threshold,
      trigger_date: condition.trigger_date,
      recurring_pattern: condition.recurring_pattern,
      confirmation_required: condition.confirmation_required,
      confirmations_received: condition.confirmations_received,
      unlock_delay_hours: condition.unlock_delay_hours,
      expiry_hours: condition.expiry_hours,
      pin_code: condition.pin_code,
      recipients: condition.recipients,
      active: condition.active,
      last_checked: condition.last_checked,
      created_at: condition.created_at,
      updated_at: condition.updated_at
    };
  });
}

export async function updateMessageCondition(
  conditionId: string,
  updates: Partial<MessageCondition>
): Promise<MessageCondition> {
  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("message_conditions")
    .update(updates)
    .eq("id", conditionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating message condition:", error);
    throw new Error(error.message || "Failed to update message condition");
  }

  return data as MessageCondition;
}

export async function deleteMessageCondition(conditionId: string): Promise<void> {
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

// Add these missing functions to fix the CheckIn.tsx errors
export async function performCheckIn(userId: string, method: string) {
  // Implementation will be added later
  const client = await getAuthClient();
  
  const { data, error } = await client
    .from("check_ins")
    .insert({
      user_id: userId,
      method: method,
      timestamp: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Error performing check-in:", error);
    throw new Error(error.message || "Failed to perform check-in");
  }

  return { success: true, data };
}

export async function getNextCheckInDeadline(userId: string) {
  // Implementation will be added later
  const client = await getAuthClient();
  
  // Get the user's latest check-in time and conditions that require regular check-ins
  const { data, error } = await client
    .from("message_conditions")
    .select("*, messages!inner(*)")
    .eq("messages.user_id", userId)
    .in("condition_type", ["no_check_in", "regular_check_in"])
    .eq("active", true)
    .order("hours_threshold", { ascending: true });

  if (error) {
    console.error("Error getting next check-in deadline:", error);
    throw new Error(error.message || "Failed to get next check-in deadline");
  }

  // For now, return a simple placeholder deadline that's 24 hours from now
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24);
  
  return {
    deadline: deadline,
    conditions: data || []
  };
}
