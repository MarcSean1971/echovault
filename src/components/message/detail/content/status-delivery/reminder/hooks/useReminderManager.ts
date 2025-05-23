
import { useState, useRef } from 'react';
import { triggerManualReminder } from '@/services/messages/whatsApp/core/reminderService';
import { toast } from "@/components/ui/use-toast";

interface UseReminderManagerProps {
  messageId?: string;
  refreshTrigger?: number;
}

interface ReminderManagerState {
  lastForceRefresh: number;
  refreshCount: number;
  isTestingReminder: boolean;
  errorState: string | null;
  refreshInProgressRef: React.MutableRefObject<boolean>;
  setErrorState: (error: string | null) => void;
  handleForceRefresh: () => Promise<void>;
  handleTestReminder: () => Promise<void>;
}

export function useReminderManager({
  messageId,
  refreshTrigger = 0,
}: UseReminderManagerProps): ReminderManagerState {
  // State for managing refresh operations
  const [lastForceRefresh, setLastForceRefresh] = useState<number>(Date.now());
  const [refreshCount, setRefreshCount] = useState<number>(refreshTrigger);
  const [isTestingReminder, setIsTestingReminder] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const refreshInProgressRef = useRef<boolean>(false);
  
  // Handler to force refresh reminder data
  const handleForceRefresh = async () => {
    if (!messageId || refreshInProgressRef.current) return;
    
    try {
      refreshInProgressRef.current = true;
      setErrorState(null);
      
      // Update state to trigger data refresh
      setLastForceRefresh(Date.now());
      setRefreshCount(prev => prev + 1);
      
      toast({
        title: "Refreshing reminder data",
        description: "Getting the latest reminder status...",
        duration: 3000,
      });
      
      // Give the UI time to update before clearing the flag
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 5000);
    } catch (error: any) {
      console.error("Error during force refresh:", error);
      setErrorState("Error refreshing reminder data");
      toast({
        title: "Refresh failed",
        description: error.message || "Could not refresh reminder data",
        variant: "destructive",
        duration: 5000,
      });
      refreshInProgressRef.current = false;
    }
  };
  
  // Handler to test the reminder functionality with improved error handling
  const handleTestReminder = async () => {
    if (!messageId || isTestingReminder) return;
    
    try {
      setIsTestingReminder(true);
      setErrorState(null);
      
      console.log("Testing reminder for message:", messageId);
      
      // FIXED: Call the reminder service with forceSend=true to ensure delivery
      // Added additional logging to track progress and identify issues
      console.log("About to call triggerManualReminder with:", {
        messageId,
        forceSend: true,
        testMode: true
      });
      
      const result = await triggerManualReminder(messageId, true, true);
      
      console.log("triggerManualReminder result:", result);
      
      if (result.success) {
        console.log("Test reminder triggered successfully");
        toast({
          title: "Test notification sent",
          description: "The test notification was sent successfully. Check your email.",
          duration: 5000,
        });
        
        // Force a refresh to show the latest status
        setLastForceRefresh(Date.now());
        setRefreshCount(prev => prev + 1);
      } else {
        console.error("Error triggering test reminder:", result.error);
        toast({
          title: "Test notification failed",
          description: result.error || "Could not send test notification",
          variant: "destructive",
          duration: 5000,
        });
        setErrorState(result.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Exception triggering test reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
        duration: 5000,
      });
      setErrorState(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsTestingReminder(false);
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
