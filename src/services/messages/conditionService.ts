
import { MessageCondition, TriggerType } from "@/types/message";
import { CreateConditionOptions } from "./conditions/types";
import { 
  createConditionInDb,
  fetchConditionsFromDb,
  updateConditionInDb,
  deleteConditionFromDb
} from "./conditions/dbOperations";
import { performCheckIn, getNextCheckInDeadline } from "./conditions/checkInService";
import { triggerPanicMessage } from "./conditions/panicTriggerService";
import { getMessageStatus } from "./conditions/messageStatusService";
import { armMessage, disarmMessage, getMessageDeadline } from "./conditions/messageArmingService";
import { mapDbConditionToMessageCondition, mapMessageConditionToDb } from "./conditions/helpers/map-helpers";

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
export { performCheckIn, getNextCheckInDeadline };

// Re-export panic trigger functions
export { triggerPanicMessage };

// Re-export message status functions
export { getMessageStatus };

// Re-export arming/disarming functions
export { armMessage, disarmMessage, getMessageDeadline };
