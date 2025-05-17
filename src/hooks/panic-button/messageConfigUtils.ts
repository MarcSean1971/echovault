
import { MessageCondition } from "@/types/message";

/**
 * Get message config from the selected message or default message
 * Unified approach that simplifies accessing panic trigger config
 */
export const getMessageConfig = (
  selectedMessageId: string | null, 
  panicMessages: MessageCondition[], 
  panicMessage: MessageCondition | null
) => {
  const message = selectedMessageId 
    ? panicMessages.find(m => m.message_id === selectedMessageId) 
    : panicMessage;
  
  if (!message) return null;
  
  // Simply use panic_trigger_config which is now consistently mapped
  // from the database's panic_config in our mapDbConditionToMessageCondition function
  return message.panic_trigger_config;
};

/**
 * Get keep_armed value from config
 */
export const getKeepArmedValue = (
  selectedMessageId: string | null, 
  panicMessages: MessageCondition[], 
  panicMessage: MessageCondition | null
): boolean => {
  const config = getMessageConfig(selectedMessageId, panicMessages, panicMessage);
  return config?.keep_armed ?? true; // Default true for safety
};

/**
 * Get cancel window seconds from config
 */
export const getCancelWindowSeconds = (
  selectedMessageId: string | null, 
  panicMessages: MessageCondition[], 
  panicMessage: MessageCondition | null
): number => {
  const config = getMessageConfig(selectedMessageId, panicMessages, panicMessage);
  return config?.cancel_window_seconds ?? 5; // Default 5 seconds for cancellation window
};
