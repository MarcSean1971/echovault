import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { updateMessageWithLocation } from "./messageUtils";

// Keep track of recently triggered message IDs to prevent duplicate triggers
const recentlyTriggeredMessages = new Map<string, number>();

/**
 * Trigger panic message with appropriate callbacks and retry logic
 * FIXED: Added deduplication to prevent multiple email sends
 */
export const triggerPanicMessageWithCallbacks = async (
  userId: string,
  messageId: string,
  options: {
    onSuccess: (result: { success: boolean, keepArmed: boolean }) => void;
    onError: (error: any) => void;
    maxRetries?: number;
  }
) => {
  const maxRetries = options.maxRetries || 1; // REDUCED from 2 to 1 retry
  let retryCount = 0;
  let lastError = null;

  // CRITICAL FIX: Add deduplication to prevent multiple triggers of the same message
  const now = Date.now();
  const lastTriggered = recentlyTriggeredMessages.get(messageId);
  
  // Prevent triggering the same message again within 30 seconds
  if (lastTriggered && (now - lastTriggered < 30000)) {
    console.log(`Message ${messageId} was triggered recently (${(now - lastTriggered) / 1000}s ago). Skipping to prevent duplicate emails.`);
    
    // Still call onSuccess to update UI, but don't trigger again
    options.onSuccess({
      success: true,
      keepArmed: true
    });
    
    return true;
  }
  
  // Mark this message as recently triggered
  recentlyTriggeredMessages.set(messageId, now);
  
  // Clean up old entries from the deduplication map
  for (const [id, timestamp] of recentlyTriggeredMessages.entries()) {
    if (now - timestamp > 60000) { // Remove after 1 minute
      recentlyTriggeredMessages.delete(id);
    }
  }
  
  const attemptTrigger = async (): Promise<boolean> => {
    try {
      console.log(`Triggering panic message for message ID: ${messageId} (Attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Update the message with current location before sending
      await updateMessageWithLocation(messageId);
      
      // Trigger the panic message
      const result = await triggerPanicMessage(userId, messageId);
      
      if (result.success) {
        toast({
          title: "EMERGENCY ALERT TRIGGERED",
          description: "Your emergency message with your current location and attachments has been sent.",
          variant: "destructive"
        });
        
        // Dispatch event with panic message ID
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            updatedAt: new Date().toISOString(),
            triggerValue: Date.now(),
            panicTrigger: true,
            panicMessageId: messageId
          }
        }));
        
        options.onSuccess({
          success: result.success,
          keepArmed: result.keepArmed
        });
        
        return true;
      } else {
        throw new Error(result.message || "Failed to trigger panic message");
      }
    } catch (error: any) {
      console.error(`Error triggering panic message (attempt ${retryCount + 1}):`, error);
      lastError = error;
      
      if (retryCount < maxRetries) {
        retryCount++;
        // ADJUSTED: Longer delay before retrying (1.5 seconds * retry number)
        await new Promise(resolve => setTimeout(resolve, 1500 * retryCount));
        return attemptTrigger();
      }
      
      // If we've reached max retries, show the error
      toast({
        title: "Emergency Alert Error",
        description: "There was an error sending your emergency message. Please try again or contact support.",
        variant: "destructive"
      });
      
      options.onError(error);
      return false;
    }
  };

  return attemptTrigger();
};
