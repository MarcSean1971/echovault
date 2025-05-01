
import { getAuthClient } from "@/lib/supabaseClient";
import { 
  MessageCondition, 
  TriggerType, 
  RecurringPattern,
  PanicTriggerConfig
} from "@/types/message";

interface CreateConditionOptions {
  // Basic options
  hoursThreshold?: number;
  confirmationRequired?: number;
  triggerDate?: string;
  recurringPattern?: RecurringPattern | null;
  
  // Recipients
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  
  // Advanced options
  pinCode?: string;
  unlockDelayHours?: number;
  expiryHours?: number;
  
  // Enhanced trigger options
  secondaryConditionType?: TriggerType;
  secondaryTriggerDate?: string;
  secondaryRecurringPattern?: RecurringPattern | null;
  reminderHours?: number[];
  panicTriggerConfig?: PanicTriggerConfig;
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
      triggered: false,
      delivered: false
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
      secondary_condition_type: condition.secondary_condition_type,
      secondary_trigger_date: condition.secondary_trigger_date,
      secondary_recurring_pattern: condition.secondary_recurring_pattern,
      reminder_hours: condition.reminder_hours,
      panic_config: condition.panic_config,
      active: condition.active,
      triggered: condition.triggered,
      delivered: condition.delivered,
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

// Check-in system functions
export async function performCheckIn(userId: string, method: string) {
  const client = await getAuthClient();
  
  // Create a new entry in the check_ins table
  const now = new Date().toISOString();
  
  try {
    // Instead of using the check_ins table that doesn't exist yet,
    // we'll update the last_checked timestamp on all active conditions
    const { data: conditionsData, error: conditionsError } = await client
      .from("message_conditions")
      .select("id, message_id, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("active", true);
      
    if (conditionsError) {
      throw new Error(conditionsError.message);
    }
    
    // Update all conditions with the new check-in time
    if (conditionsData && conditionsData.length > 0) {
      const conditionIds = conditionsData.map(c => c.id);
      
      const { error: updateError } = await client
        .from("message_conditions")
        .update({ last_checked: now })
        .in("id", conditionIds);
        
      if (updateError) {
        throw new Error(updateError.message);
      }
    }
    
    // Log the check-in in the messages table for now (since we don't have check_ins yet)
    return {
      success: true,
      timestamp: now,
      method: method,
      conditions_updated: conditionsData?.length || 0
    };
  } catch (error: any) {
    console.error("Error performing check-in:", error);
    throw new Error(error.message || "Failed to perform check-in");
  }
}

export async function getNextCheckInDeadline(userId: string) {
  const client = await getAuthClient();
  
  try {
    // Get all active conditions that are check-in based
    const { data, error } = await client
      .from("message_conditions")
      .select("*, messages!inner(*)")
      .eq("messages.user_id", userId)
      .in("condition_type", ["no_check_in", "regular_check_in", "inactivity_to_recurring", "inactivity_to_date"])
      .eq("active", true)
      .order("hours_threshold", { ascending: true });
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Calculate the next deadline for each condition
    const now = new Date();
    let earliestDeadline: Date | null = null;
    
    if (data && data.length > 0) {
      data.forEach(condition => {
        // Convert last_checked to a Date
        const lastChecked = new Date(condition.last_checked);
        
        // Add hours_threshold to get the deadline
        const deadline = new Date(lastChecked);
        deadline.setHours(deadline.getHours() + condition.hours_threshold);
        
        // If this is earlier than our current earliest, update it
        if (!earliestDeadline || deadline < earliestDeadline) {
          earliestDeadline = deadline;
        }
      });
    }
    
    // If no conditions found, default to 24 hours from now
    if (!earliestDeadline) {
      earliestDeadline = new Date();
      earliestDeadline.setHours(earliestDeadline.getHours() + 24);
    }
    
    return {
      deadline: earliestDeadline,
      conditions: data || []
    };
  } catch (error: any) {
    console.error("Error getting next check-in deadline:", error);
    throw new Error(error.message || "Failed to get next check-in deadline");
  }
}

// New: Functions for handling panic triggers
export async function triggerPanicMessage(userId: string, messageId: string) {
  const client = await getAuthClient();
  
  try {
    // First, verify the user owns this message and it has a panic trigger
    const { data, error } = await client
      .from("message_conditions")
      .select("*, messages!inner(*)")
      .eq("message_id", messageId)
      .eq("messages.user_id", userId)
      .eq("condition_type", "panic_trigger")
      .eq("active", true)
      .single();
      
    if (error) {
      throw new Error("Message not found or you don't have permission to trigger it");
    }
    
    // Mark the message as triggered
    const { error: updateError } = await client
      .from("message_conditions")
      .update({ 
        triggered: true,
        delivered: true // For panic, we consider it delivered immediately
      })
      .eq("id", data.id);
      
    if (updateError) {
      throw new Error("Failed to trigger panic message");
    }
    
    // Return success
    return {
      success: true,
      message: "Panic message triggered successfully",
      triggered_at: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Error triggering panic message:", error);
    throw new Error(error.message || "Failed to trigger panic message");
  }
}

// New function to get message status history
export async function getMessageStatus(messageId: string) {
  const client = await getAuthClient();
  
  try {
    const { data, error } = await client
      .from("message_conditions")
      .select("*, messages!inner(*)")
      .eq("message_id", messageId)
      .single();
      
    if (error) {
      throw new Error("Message not found");
    }
    
    // Calculate status based on condition fields
    let status = 'armed';
    
    if (data.triggered && data.delivered) {
      status = 'delivered';
    } else if (data.triggered && !data.delivered) {
      status = 'triggered';
    } else if (!data.active) {
      status = 'cancelled';
    }
    
    // TODO: In future we'd check for viewed/unlocked statuses from recipient_interactions table
    
    return {
      id: data.id,
      message_id: data.message_id,
      status: status,
      active: data.active,
      triggered: data.triggered,
      delivered: data.delivered,
      last_checked: data.last_checked,
      condition_type: data.condition_type
    };
  } catch (error: any) {
    console.error("Error getting message status:", error);
    throw new Error(error.message || "Failed to get message status");
  }
}
