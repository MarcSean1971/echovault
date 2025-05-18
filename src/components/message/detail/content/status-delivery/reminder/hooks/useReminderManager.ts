
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { triggerManualReminder } from "@/services/messages/whatsApp/core/reminderService";

interface ReminderManagerProps {
  messageId?: string;
  refreshTrigger?: number;
}

export function useReminderManager({ messageId, refreshTrigger }: ReminderManagerProps) {
  // State for managing refresh and loading states
  const [lastForceRefresh, setLastForceRefresh] = useState<number>(0);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [isTestingReminder, setIsTestingReminder] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // References for rate limiting
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const testButtonClickedRef = useRef<boolean>(false);
  
  // Handler for manually refreshing reminder data with rate limiting
  const handleForceRefresh = () => {
    try {
      // Rate limiting implementation - prevent refreshes more than once every 2 seconds
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 2000 || refreshInProgressRef.current) {
        console.log(`[ReminderSection] Refresh rate limited - last refresh ${now - lastRefreshTimeRef.current}ms ago`);
        return;
      }
      
      lastRefreshTimeRef.current = now;
      refreshInProgressRef.current = true;
      
      setErrorState(null);
      setLastForceRefresh(now);
      setRefreshCount(prev => prev + 1);
      
      // Only show toast for user-initiated refreshes, not automatic ones
      if (!testButtonClickedRef.current) {
        toast({
          title: "Refreshing reminders data",
          description: "The reminders list is being updated...",
          duration: 2000,
        });
      }
      
      // Reset test button flag
      testButtonClickedRef.current = false;
      
      // Reset refreshInProgress after a delay
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 2000);
      
    } catch (error) {
      console.error("Error forcing refresh:", error);
      setErrorState("Failed to refresh reminder data");
      refreshInProgressRef.current = false;
    }
  };
  
  // Handle manual test of reminder delivery
  const handleTestReminder = async () => {
    if (!messageId) return;
    
    setIsTestingReminder(true);
    testButtonClickedRef.current = true;
    
    try {
      // Updated to explicitly set testMode=true
      await triggerManualReminder(messageId, true, true);
      
      // Single refresh after a delay instead of multiple refreshes
      setTimeout(() => {
        console.log(`[ReminderSection] Performing single refresh after test reminder`);
        handleForceRefresh();
      }, 2000);
      
    } catch (error) {
      console.error("Error testing reminder:", error);
      setErrorState("Failed to test reminder");
    } finally {
      setIsTestingReminder(false);
    }
  };
  
  // Listen for condition-updated events to automatically refresh
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent && messageId) {
        // Enhanced event filtering to prevent cascading refreshes
        const eventDetail = event.detail || {};
        const isRelevant = 
          (eventDetail.messageId && eventDetail.messageId === messageId);
          
        // Skip events that don't match our message or were triggered by this component
        if (!isRelevant || eventDetail.source === 'reminder-section-refresh') {
          return;
        }
        
        // Log specific event details for debugging
        console.log(`[ReminderSection] Received relevant conditions-updated event: ${eventDetail.action || 'update'}`);
        
        // Use rate limiting for event-triggered refreshes
        const now = Date.now();
        if (now - lastRefreshTimeRef.current < 5000 || refreshInProgressRef.current) {
          console.log(`[ReminderSection] Event-triggered refresh skipped due to rate limiting`);
          return;
        }
        
        // Single refresh with specific origin identifier
        handleForceRefresh();
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => window.removeEventListener('conditions-updated', handleConditionUpdated);
  }, [messageId]);
  
  // Listen for external refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log(`[ReminderSection] External refresh trigger changed: ${refreshTrigger}`);
      // Use the same rate limiting for external triggers
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 3000 || refreshInProgressRef.current) {
        console.log(`[ReminderSection] External refresh skipped due to rate limiting`);
        return;
      }
      
      handleForceRefresh();
    }
  }, [refreshTrigger]);
  
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
