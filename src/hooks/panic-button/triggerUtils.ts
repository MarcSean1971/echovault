
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { updateMessageWithLocation } from "./messageUtils";

/**
 * Trigger panic message with appropriate callbacks and retry logic
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
  const maxRetries = options.maxRetries || 2; // Default to 2 retries
  let retryCount = 0;
  let lastError = null;

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
        // Add a small delay before retrying (500ms * retry number)
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
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
