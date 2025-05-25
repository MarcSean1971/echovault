
import { MessageCondition, TriggerType } from "@/types/message";
import { CreateConditionOptions } from "./conditions/types";
import { 
  createConditionInDb,
  fetchConditionsFromDb,
  updateConditionInDb,
  deleteConditionFromDb,
  invalidateConditionsCache
} from "./conditions/dbOperations";
import { performUserCheckIn, getNextCheckInDeadline as getCheckInDeadlineFromService } from "./conditions/checkInService";
import { triggerPanicMessage } from "./conditions/panicTriggerService";
import { getMessageStatus } from "./conditions/messageStatusService";
import { armMessage, disarmMessage, getMessageDeadline } from "./conditions/messageArmingService";
import { mapDbConditionToMessageCondition, mapMessageConditionToDb } from "./conditions/helpers/map-helpers";
import { supabase } from "@/integrations/supabase/client";
import { createReminderSchedule, markRemindersObsolete } from "@/services/reminders/simpleReminderService";

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
    panic_config: options.panicTriggerConfig,
    reminder_hours: options.reminderHours,
    check_in_code: options.checkInCode
  };
  
  const createdCondition = await createConditionInDb(data);
  const condition = mapDbConditionToMessageCondition(createdCondition);
  
  // SIMPLIFIED: Create reminder schedule immediately after condition creation
  if (condition.active && options.reminderHours) {
    await createReminderSchedule({
      messageId: messageId,
      conditionId: condition.id,
      conditionType: conditionType,
      triggerDate: options.triggerDate,
      lastChecked: createdCondition.last_checked,
      hoursThreshold: options.hoursThreshold,
      minutesThreshold: options.minutesThreshold,
      reminderHours: options.reminderHours
    });
  }
  
  return condition;
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
  const dbUpdates = mapMessageConditionToDb(updates);
  
  const data = await updateConditionInDb(conditionId, dbUpdates);
  const condition = mapDbConditionToMessageCondition(data);
  
  // SIMPLIFIED: Update reminder schedule when condition changes
  if (condition.message_id && updates.reminder_hours) {
    await markRemindersObsolete(condition.message_id);
    
    if (condition.active) {
      await createReminderSchedule({
        messageId: condition.message_id,
        conditionId: conditionId,
        conditionType: condition.condition_type,
        triggerDate: condition.trigger_date,
        lastChecked: condition.last_checked,
        hoursThreshold: condition.hours_threshold,
        minutesThreshold: condition.minutes_threshold,
        reminderHours: updates.reminder_hours
      });
    }
  }
  
  return condition;
}

// Delete a message condition
export async function deleteMessageCondition(conditionId: string): Promise<void> {
  return deleteConditionFromDb(conditionId);
}

// Re-export the new messageConditionService function
export { getConditionByMessageId } from './conditions/messageConditionService';

// Re-export check-in functions with the correct name
export { performUserCheckIn as performCheckIn };

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
 * SIMPLIFIED: Enhanced version of getNextCheckInDeadline
 */
export async function getNextCheckInDeadline(userId: string) {
  if (!userId) return null;
  
  try {
    const { data: conditions, error } = await supabase
      .from("message_conditions")
      .select("*")
      .eq("active", true)
      .in("condition_type", ["no_check_in", "recurring_check_in", "inactivity_to_date"]);
    
    if (error) throw error;
    
    if (!conditions || conditions.length === 0) {
      return null;
    }
    
    let earliestDeadline: Date | null = null;
    
    for (const condition of conditions) {
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
