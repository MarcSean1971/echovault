
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
        console.log(`[ReminderManager] Refresh rate limited - last refresh ${now - lastRefreshTimeRef.current}ms ago`);
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
      console.error("[ReminderManager] Error forcing refresh:", error);
      setErrorState("Failed to refresh reminder data");
      refreshInProgressRef.current = false;
    }
  };
  
  // Handle manual test of reminder delivery
  const handleTestReminder = async () => {
    if (!messageId) {
      toast({
        title: "Error",
        description: "Message ID is required to send a test reminder",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsTestingReminder(true);
    testButtonClickedRef.current = true;
    
    try {
      console.log(`[ReminderManager] Sending test reminder for message ${messageId}`);
      
      // CRITICAL FIX: Always pass true for both parameters to ensure test reminders are sent
      const result = await triggerManualReminder(messageId, true, true);
      
      if (result.success) {
        toast({
          title: "Test Reminder Sent",
          description: "Check your email shortly for the test reminder.",
          duration: 5000,
        });
      } else {
        throw new Error(result.error || "Failed to send test reminder");
      }
      
      // Single refresh after a delay instead of multiple refreshes
      setTimeout(() => {
        console.log(`[ReminderManager] Performing single refresh after test reminder`);
        handleForceRefresh();
      }, 2000);
      
    } catch (error: any) {
      console.error("[ReminderManager] Error testing reminder:", error);
      setErrorState("Failed to test reminder");
      
      toast({
        title: "Error Sending Reminder",
        description: error.message || "Failed to send test reminder. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
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
        console.log(`[ReminderManager] Received relevant conditions-updated event: ${eventDetail.action || 'update'}`);
        
        // Use rate limiting for event-triggered refreshes
        const now = Date.now();
        if (now - lastRefreshTimeRef.current < 5000 || refreshInProgressRef.current) {
          console.log(`[ReminderManager] Event-triggered refresh skipped due to rate limiting`);
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
      console.log(`[ReminderManager] External refresh trigger changed: ${refreshTrigger}`);
      // Use the same rate limiting for external triggers
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < 3000 || refreshInProgressRef.current) {
        console.log(`[ReminderManager] External refresh skipped due to rate limiting`);
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
