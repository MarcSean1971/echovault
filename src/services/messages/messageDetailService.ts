
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { armMessage, disarmMessage, getMessageDeadline as fetchDeadline } from "./conditionService";

/**
 * Deletes a message with the given ID
 */
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
      
    if (error) throw error;
    
    toast({
      title: "Message deleted",
      description: "Your message has been permanently deleted",
    });
    
    return true;
  } catch (error: any) {
    console.error("Error deleting message:", error);
    toast({
      title: "Error",
      description: "Failed to delete the message",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Arms a message with the given condition ID
 */
export const handleArmMessage = async (conditionId: string, setIsArmed: (isArmed: boolean) => void): Promise<Date | null> => {
  try {
    await armMessage(conditionId);
    setIsArmed(true);
    
    // Get updated deadline
    const deadlineDate = await fetchDeadline(conditionId);
    
    toast({
      title: "Message armed",
      description: "Your message has been armed and will trigger according to your settings",
    });
    
    return deadlineDate;
  } catch (error) {
    console.error("Error arming message:", error);
    toast({
      title: "Failed to arm message",
      description: "There was a problem arming your message",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Disarms a message with the given condition ID
 */
export const handleDisarmMessage = async (conditionId: string, setIsArmed: (isArmed: boolean) => void): Promise<void> => {
  try {
    await disarmMessage(conditionId);
    setIsArmed(false);
    
    toast({
      title: "Message disarmed",
      description: "Your message has been disarmed and will not trigger",
    });
  } catch (error) {
    console.error("Error disarming message:", error);
    toast({
      title: "Failed to disarm message",
      description: "There was a problem disarming your message",
      variant: "destructive"
    });
  }
};

// Using the imported function instead
export { fetchDeadline as getMessageDeadline };
