
import { toast } from "@/hooks/use-toast";

/**
 * ENHANCED: Hook for showing action-related toast messages with detailed error info
 */
export function useActionToasts() {
  const showArmSuccess = () => {
    toast({
      title: "Message Armed",
      description: "Your message has been successfully armed and reminder schedule created.",
      duration: 3000,
    });
  };

  const showArmError = (errorMessage?: string) => {
    toast({
      title: "Failed to Arm Message",
      description: errorMessage || "There was an error arming your message. Please try again.",
      variant: "destructive",
      duration: 8000,
    });
  };

  const showDisarmSuccess = () => {
    toast({
      title: "Message Disarmed",
      description: "Your message has been successfully disarmed and reminders cleared.",
      duration: 3000,
    });
  };

  const showDisarmError = (errorMessage?: string) => {
    toast({
      title: "Failed to Disarm Message",
      description: errorMessage || "There was an error disarming your message. Please try again.",
      variant: "destructive",
      duration: 8000,
    });
  };

  const showReminderError = (errorMessage?: string) => {
    toast({
      title: "Reminder Setup Failed",
      description: errorMessage || "Failed to set up reminder schedule. Your message may not send reminders properly.",
      variant: "destructive",
      duration: 10000,
    });
  };

  return {
    showArmSuccess,
    showArmError,
    showDisarmSuccess,
    showDisarmError,
    showReminderError
  };
}
