
import { toast } from "@/components/ui/use-toast";

/**
 * Hook for handling action-related toast notifications
 */
export function useActionToasts() {
  const showArmSuccess = () => {
    toast({
      title: "Message armed",
      description: "Your message has been armed and will trigger according to your settings",
      variant: "purple"
    });
  };
  
  const showArmError = () => {
    toast({
      title: "Failed to arm message",
      description: "There was a problem arming your message",
      variant: "destructive"
    });
  };
  
  const showDisarmSuccess = () => {
    toast({
      title: "Message disarmed",
      description: "Your message has been disarmed and will not trigger",
      variant: "purple"
    });
  };
  
  const showDisarmError = () => {
    toast({
      title: "Failed to disarm message",
      description: "There was a problem disarming your message",
      variant: "destructive"
    });
  };
  
  return {
    showArmSuccess,
    showArmError,
    showDisarmSuccess,
    showDisarmError
  };
}
