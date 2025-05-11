
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { updateMessageWithLocation } from "./messageUtils";

/**
 * Trigger panic message with appropriate callbacks
 */
export const triggerPanicMessageWithCallbacks = async (
  userId: string,
  messageId: string,
  options: {
    onSuccess: (result: { success: boolean, keepArmed: boolean }) => void;
    onError: (error: any) => void;
  }
) => {
  try {
    console.log(`Triggering panic message for message ID: ${messageId}`);
    
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
    }
  } catch (error: any) {
    console.error("Error triggering panic message:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to trigger panic message. Please try again.",
      variant: "destructive"
    });
    options.onError(error);
  }
};
