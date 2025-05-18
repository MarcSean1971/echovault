
/**
 * Service functions for testing reminders
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ReminderResult } from "./types";

/**
 * Manually test the reminder trigger functionality
 * This is useful for debugging the reminder system
 */
export async function testReminderTrigger(messageId: string, conditionId: string): Promise<boolean> {
  try {
    console.log("[REMINDER-SERVICE] Testing reminder trigger for message:", messageId);
    
    // Create a test reminder entry in sent_reminders
    const { data, error } = await supabase
      .from('sent_reminders')
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        user_id: (await supabase.auth.getUser()).data.user?.id || 'unknown',
        deadline: new Date().toISOString(),
        sent_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("[REMINDER-SERVICE] Error creating test reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create test reminder: " + error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Test Reminder Created",
      description: "A test reminder has been created and should trigger the email notification system",
      duration: 5000,
    });
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in testReminderTrigger:", error);
    return false;
  }
}
