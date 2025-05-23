
import { useState, useRef } from 'react';
import { triggerManualReminder } from '@/services/messages/whatsApp/core/reminderService';

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
      
      // Give the UI time to update before clearing the flag
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 5000);
    } catch (error) {
      console.error("Error during force refresh:", error);
      setErrorState("Error refreshing reminder data");
      refreshInProgressRef.current = false;
    }
  };
  
  // Handler to test the reminder functionality
  const handleTestReminder = async () => {
    if (!messageId || isTestingReminder) return;
    
    try {
      setIsTestingReminder(true);
      setErrorState(null);
      
      console.log("Testing reminder for message:", messageId);
      
      // FIXED: Call the reminder service with forceSend=true to ensure delivery
      const result = await triggerManualReminder(messageId, true, true);
      
      if (result.success) {
        console.log("Test reminder triggered successfully");
        
        // Force a refresh to show the latest status
        setLastForceRefresh(Date.now());
        setRefreshCount(prev => prev + 1);
      } else {
        console.error("Error triggering test reminder:", result.error);
        setErrorState(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Exception triggering test reminder:", error);
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
