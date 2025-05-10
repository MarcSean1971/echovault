
import { MessageCondition, TriggerType } from "@/types/message";
import { CreateConditionOptions } from "./types";
import { 
  createConditionInDb,
  fetchConditionsFromDb,
  updateConditionInDb,
  deleteConditionFromDb,
  mapDbConditionToMessageCondition
} from "./conditions/dbOperations";

// Create a message condition
export async function createMessageCondition(
  messageId: string,
  conditionType: TriggerType,
  options: CreateConditionOptions
): Promise<MessageCondition> {
  const data = await createConditionInDb(messageId, conditionType, options);
  return mapDbConditionToMessageCondition(data);
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
  const data = await updateConditionInDb(conditionId, updates);
  return mapDbConditionToMessageCondition(data);
}

// Delete a message condition
export async function deleteMessageCondition(conditionId: string): Promise<void> {
  return deleteConditionFromDb(conditionId);
}

// Get condition by message ID
export async function getConditionByMessageId(messageId: string): Promise<MessageCondition | null> {
  try {
    // Import here to avoid circular imports
    const { getConditionByMessageId: fetchCondition } = await import('./conditions/messageConditionService');
    return await fetchCondition(messageId);
  } catch (error) {
    console.error("Error in getConditionByMessageId:", error);
    throw error;
  }
}

// Re-export check-in functions
export { performCheckIn, getNextCheckInDeadline } from './conditions/checkInService';

// Re-export panic trigger functions
export { triggerPanicMessage } from './conditions/panicTriggerService';

// Re-export message status functions
export { getMessageStatus } from './conditions/messageStatusService';

// Re-export arming/disarming functions
export { armMessage, disarmMessage, getMessageDeadline } from './conditions/messageArmingService';
