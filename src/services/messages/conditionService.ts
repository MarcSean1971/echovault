
import { MessageCondition, TriggerType } from "@/types/message";
import { CreateConditionOptions } from "./conditions/types";
import { 
  createConditionInDb,
  fetchConditionsFromDb,
  updateConditionInDb,
  deleteConditionFromDb,
  invalidateConditionsCache
} from "./conditions/dbOperations";
import { performCheckIn, getNextCheckInDeadline as getCheckInDeadlineFromService } from "./conditions/checkInService";
import { triggerPanicMessage } from "./conditions/panicTriggerService";
import { getMessageStatus } from "./conditions/messageStatusService";
import { armMessage, disarmMessage, getMessageDeadline } from "./conditions/messageArmingService";
import { mapDbConditionToMessageCondition, mapMessageConditionToDb } from "./conditions/helpers/map-helpers";
import { supabase } from "@/integrations/supabase/client";

// Create a message condition
export async function createMessageCondition(
  messageId: string,
  conditionType: TriggerType,
  options: CreateConditionOptions
): Promise<MessageCondition> {
  const data = {
    message_id: messageId,
    condition_type: conditionType,
    hours_threshold: options.hoursThreshold,
    minutes_threshold: options.minutesThreshold,
    trigger_date: options.triggerDate,
    recurring_pattern: options.recurringPattern,
    recipients: options.recipients,
    pin_code: options.pinCode,
    unlock_delay_hours: options.unlockDelayHours,
    expiry_hours: options.expiryHours,
    // Map panicTriggerConfig to panic_config for DB storage
    panic_config: options.panicTriggerConfig,
    reminder_hours: options.reminderHours,
    check_in_code: options.checkInCode
  };
  
  const createdCondition = await createConditionInDb(data);
  return mapDbConditionToMessageCondition(createdCondition);
}

// Fetch message conditions for a user
export async function fetchMessageConditions(userId: string): Promise<MessageCondition[]> {
  return fetchConditionsFromDb(userId);
}

// Update a message condition
export async function updateMessageCondition(
  conditionId: string,
  updates: Partial<MessageCondition>
): Promise<MessageCondition> {
  // Use the centralized mapping function to ensure consistency
  const dbUpdates = mapMessageConditionToDb(updates);
  
  const data = await updateConditionInDb(conditionId, dbUpdates);
  return mapDbConditionToMessageCondition(data);
}

// Delete a message condition
export async function deleteMessageCondition(conditionId: string): Promise<void> {
  return deleteConditionFromDb(conditionId);
}

// Re-export the new messageConditionService function
export { getConditionByMessageId } from './conditions/messageConditionService';

// Re-export check-in functions
export { performCheckIn };

// Re-export the deadline calculation function from checkInService with a more specific name
export { getCheckInDeadlineFromService as getConditionDeadline };

// Re-export panic trigger functions
export { triggerPanicMessage };

// Re-export message status functions
export { getMessageStatus };

// Re-export arming/disarming functions
export { armMessage, disarmMessage, getMessageDeadline };

// Re-export cache invalidation function
export { invalidateConditionsCache };

/**
 * Enhanced version of getNextCheckInDeadline with user-specific deadline calculation
 */
export async function getNextCheckInDeadline(userId: string) {
  if (!userId) return null;
  
  try {
    // Get active conditions for user
    const { data: conditions, error } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (error) throw error;
    
    if (!conditions || conditions.length === 0) {
      return null;
    }
    
    // Calculate the earliest deadline from all active conditions
    let earliestDeadline: Date | null = null;
    
    for (const condition of conditions) {
      // Use the imported function from checkInService
      const deadline = getCheckInDeadlineFromService(condition);
      
      if (deadline && (!earliestDeadline || deadline < earliestDeadline)) {
        earliestDeadline = deadline;
      }
    }
    
    return earliestDeadline;
  } catch (error) {
    console.error("Error getting next check-in deadline:", error);
    return null;
  }
}
