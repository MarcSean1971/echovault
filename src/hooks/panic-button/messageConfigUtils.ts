
import { MessageCondition } from "@/types/message";

/**
 * Utilities for handling message configuration
 */

/**
 * Get message config from the selected message or default message
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
  
  // First check panic_trigger_config
  if (message.panic_trigger_config) {
    return message.panic_trigger_config;
  }
  
  // Fall back to panic_config if panic_trigger_config is not available
  if (message.panic_config) {
    return message.panic_config;
  }
  
  return null;
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
