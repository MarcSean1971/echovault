
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureReminderSchedule } from "@/utils/reminder/ensureReminderSchedule";
import { toast } from "@/components/ui/use-toast";

interface ReminderManagerOptions {
  messageId?: string;
  refreshTrigger?: number;
}

export function useReminderManager({ messageId, refreshTrigger }: ReminderManagerOptions) {
  const [lastForceRefresh, setLastForceRefresh] = useState<number>(0);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [isTestingReminder, setIsTestingReminder] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const refreshInProgressRef = useRef<boolean>(false);

  // Handler for testing the reminder delivery
  const handleTestReminder = async () => {
    if (!messageId || isTestingReminder || refreshInProgressRef.current) return;
    
    try {
      setIsTestingReminder(true);
      setErrorState(null);
      
      console.log(`[useReminderManager] Testing reminder delivery for message ${messageId}`);
      
      const { error } = await supabase.functions.invoke("send-reminder-emails", {
        body: { 
          messageId,
          debug: true,
          forceSend: true,  // We do want to force for test
          action: "test-delivery",
          source: "test-button"
        }
      });
      
      if (error) {
        console.error("Error testing reminder:", error);
        setErrorState(`Test failed: ${error.message}`);
        toast({
          title: "Test Failed",
          description: "Could not test reminder delivery. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log("Test reminder sent successfully");
        toast({
          title: "Test Sent",
          description: "Reminder test was sent successfully. Check your email.",
          duration: 5000
        });
        
        // Trigger a refresh of the reminder data
        setLastForceRefresh(Date.now());
        setRefreshCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Exception testing reminder:", err);
      setErrorState(`Error: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Error",
        description: "Failed to send test reminder.",
        variant: "destructive"
      });
    } finally {
      setIsTestingReminder(false);
    }
  };

  // Handler for forcing a reminder schedule refresh
  const handleForceRefresh = async () => {
    if (!messageId || refreshInProgressRef.current) return;
    
    try {
      refreshInProgressRef.current = true;
      setErrorState(null);
      console.log(`[useReminderManager] Force refreshing reminder schedule for message ${messageId}`);
      
      // Regenerate the reminder schedule
      const result = await ensureReminderSchedule(messageId, true); // Specify this is an update, not a new message
      
      if (result) {
        console.log("[useReminderManager] Successfully regenerated reminder schedule");
        toast({
          title: "Success",
          description: "Reminder schedule has been refreshed.",
          duration: 3000
        });
        
        // Update the refresh counter to trigger data reload
        setLastForceRefresh(Date.now());
        setRefreshCount(prev => prev + 1);
      } else {
        console.error("[useReminderManager] Failed to regenerate reminder schedule");
        setErrorState("Failed to refresh reminder schedule");
        toast({
          title: "Error",
          description: "Could not refresh reminder schedule.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Exception refreshing reminder schedule:", err);
      setErrorState(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      refreshInProgressRef.current = false;
    }
  };

  return {
    lastForceRefresh,
    refreshCount,
    isTestingReminder,
    errorState,
    refreshInProgressRef,
    setErrorState,
    handleForceRefresh,
    handleTestReminder
  };
}
