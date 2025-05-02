import { MessageCondition, TriggerType } from "@/types/message";
import { CreateConditionOptions } from "./conditions/types";
import { 
  createConditionInDb,
  fetchConditionsFromDb,
  updateConditionInDb,
  deleteConditionFromDb,
  mapDbConditionToMessageCondition
} from "./conditions/dbOperations";
import { performCheckIn, getNextCheckInDeadline } from "./conditions/checkInService";
import { triggerPanicMessage } from "./conditions/panicTriggerService";
import { getMessageStatus } from "./conditions/messageStatusService";

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

// Re-export the new messageConditionService function
export { getConditionByMessageId } from './conditions/messageConditionService';

// Re-export check-in functions
export { performCheckIn, getNextCheckInDeadline };

// Re-export panic trigger functions
export { triggerPanicMessage };

// Re-export message status functions
export { getMessageStatus };
