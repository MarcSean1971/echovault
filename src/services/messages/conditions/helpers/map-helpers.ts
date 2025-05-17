import { MessageCondition, RecurringPattern } from "@/types/message";

/**
 * Helper function to map database condition to application condition
 */
export function mapDbConditionToMessageCondition(condition: any): MessageCondition {
  return {
    ...condition,
    // Add the fields that don't exist in the database but are used in the application
    triggered: !condition.active, // If not active, we consider it triggered for now
    delivered: !condition.active, // If not active, we consider it delivered for now
    // For recurring patterns, preserve the structure
    recurring_pattern: condition.recurring_pattern as RecurringPattern | null,
    // Map panic_config from DB to panic_trigger_config for the application
    // While keeping panic_config for backward compatibility
    panic_trigger_config: condition.panic_config || undefined,
    // Map additional fields
    unlock_delay_hours: condition.unlock_delay_hours || 0,
    expiry_hours: condition.expiry_hours || 0
  } as MessageCondition;
}

/**
 * Helper function to map application condition to database format
 * This consolidates the mapping in one place to avoid inconsistencies
 */
export function mapMessageConditionToDb(condition: Partial<MessageCondition>): any {
  const dbCondition = { ...condition };
  
  // Map panic_trigger_config to panic_config for database storage
  if ('panic_trigger_config' in condition) {
    dbCondition.panic_config = condition.panic_trigger_config;
    delete dbCondition.panic_trigger_config;
  }
  
  return dbCondition;
}
