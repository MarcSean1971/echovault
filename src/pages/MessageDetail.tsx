
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageLoading } from "@/components/message/detail/MessageLoading";
import { MessageNotFound } from "@/components/message/detail/MessageNotFound";
import { MessageDetailContent } from "@/components/message/detail/MessageDetailContent";
import { formatDate, getConditionType } from "@/utils/messageHelpers";
import { useMessageDetail } from "@/hooks/useMessageDetail";
import { MessageRecipientProvider } from "@/components/message/detail/MessageRecipientProvider";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useMessageDeliveryStatus } from "@/hooks/useMessageDeliveryStatus";
import { triggerDeadmanSwitch } from "@/services/messages/whatsApp";
import { toast } from "@/components/ui/use-toast";

// Add browser storage key constants
const DEADLINE_STORAGE_KEY = "deadmanswitch_deadline_";
const DELIVERY_ATTEMPTED_KEY = "deadmanswitch_attempted_";
const MAX_DELIVERY_RETRIES = 3;

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [deadlineMonitorActive, setDeadlineMonitorActive] = useState<boolean>(false);
  const [deliveryAttempted, setDeliveryAttempted] = useState<boolean>(false);
  const [deliveryRetries, setDeliveryRetries] = useState<number>(0);

  // Use memoized callback for error navigation to prevent recreation on each render
  const handleError = useCallback(() => navigate("/messages"), [navigate]);

  // Use our custom hook to fetch the message data
  const { 
    message, 
    isLoading, 
    isArmed, 
    deadline, 
    conditionId, 
    condition, 
    recipients,
    setIsArmed,
    lastCheckIn,
    refreshCount
  } = useMessageDetail(id, handleError);
  
  // Get message delivery status
  const { isDelivered, lastDelivered, viewCount, isLoading: isLoadingDelivery } = useMessageDeliveryStatus(id || '');
  
  // Use our custom hook for message actions
  const {
    isActionLoading,
    showSendTestDialog,
    setShowSendTestDialog,
    handleMessageDelete,
    onArmMessage,
    onDisarmMessage,
    onSendTestMessage,
    handleSendTestMessages
  } = useMessageActions(id, conditionId, setIsArmed);
  
  // Get the recipient rendering function
  const { renderRecipients } = MessageRecipientProvider({ recipients });

  // Function to save deadline to localStorage
  const saveDeadlineToStorage = useCallback((msgId: string, deadlineTime: number) => {
    try {
      localStorage.setItem(DEADLINE_STORAGE_KEY + msgId, deadlineTime.toString());
      console.log(`[MessageDetail] Deadline saved to storage: ${new Date(deadlineTime).toISOString()}`);
    } catch (e) {
      console.error('[MessageDetail] Failed to save deadline to storage:', e);
    }
  }, []);

  // Function to check if delivery was already attempted
  const checkDeliveryAttempted = useCallback((msgId: string): boolean => {
    try {
      const attempted = localStorage.getItem(DELIVERY_ATTEMPTED_KEY + msgId);
      return attempted === 'true';
    } catch (e) {
      console.error('[MessageDetail] Failed to check delivery attempted status:', e);
      return false;
    }
  }, []);

  // Function to mark delivery as attempted
  const markDeliveryAttempted = useCallback((msgId: string) => {
    try {
      localStorage.setItem(DELIVERY_ATTEMPTED_KEY + msgId, 'true');
      setDeliveryAttempted(true);
    } catch (e) {
      console.error('[MessageDetail] Failed to mark delivery as attempted:', e);
    }
  }, []);

  // Function to reset delivery attempted status
  const resetDeliveryAttempted = useCallback((msgId: string) => {
    try {
      localStorage.removeItem(DELIVERY_ATTEMPTED_KEY + msgId);
      setDeliveryAttempted(false);
      setDeliveryRetries(0);
    } catch (e) {
      console.error('[MessageDetail] Failed to reset delivery status:', e);
    }
  }, []);

  // Function to trigger the deadman switch manually as a fallback
  const handleForceDelivery = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log(`[MessageDetail] Forcing delivery of message ${id} manually at ${new Date().toISOString()}`);
      
      toast({
        title: "Forcing message delivery",
        description: "Manually triggering message delivery...",
        duration: 3000,
      });
      
      setDeliveryRetries(prev => prev + 1);
      const result = await triggerDeadmanSwitch(id);
      
      if (result.success) {
        console.log(`[MessageDetail] Force delivery successful for message ${id}`);
        // Reset delivery tracking on successful delivery
        resetDeliveryAttempted(id);
        // Refresh data after successful delivery
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.error(`[MessageDetail] Force delivery failed for message ${id}:`, result.error);
        toast({
          title: "Delivery failed",
          description: "Failed to deliver the message. Will retry automatically.",
          variant: "destructive",
          duration: 5000,
        });

        // Schedule a retry after a short delay if under retry limit
        if (deliveryRetries < MAX_DELIVERY_RETRIES) {
          setTimeout(() => handleForceDelivery(), 3000);
        }
      }
    } catch (error) {
      console.error(`[MessageDetail] Error in force delivery for message ${id}:`, error);
      // Schedule a retry after a short delay if under retry limit
      if (deliveryRetries < MAX_DELIVERY_RETRIES) {
        setTimeout(() => handleForceDelivery(), 3000);
      }
    }
  }, [id, deliveryRetries, resetDeliveryAttempted]);

  // Check for missed deadlines on component mount
  useEffect(() => {
    if (!id || isDelivered || !isArmed) return;
    
    const attemptedBefore = checkDeliveryAttempted(id);
    setDeliveryAttempted(attemptedBefore);
    
    // Check if there's a saved deadline
    try {
      const savedDeadlineStr = localStorage.getItem(DEADLINE_STORAGE_KEY + id);
      if (savedDeadlineStr) {
        const savedDeadline = parseInt(savedDeadlineStr, 10);
        const now = Date.now();
        
        // If deadline has passed and delivery not attempted yet
        if (savedDeadline && now > savedDeadline && !attemptedBefore) {
          console.log(`[MessageDetail] Detected missed deadline from storage: ${new Date(savedDeadline).toISOString()}`);
          console.log(`[MessageDetail] Current time: ${new Date(now).toISOString()}`);
          console.log(`[MessageDetail] Triggering missed deadline delivery`);
          
          // Mark as attempted before triggering to prevent loops
          markDeliveryAttempted(id);
          
          // Trigger delivery for missed deadline
          setTimeout(() => handleForceDelivery(), 1000);
        }
      }
    } catch (e) {
      console.error('[MessageDetail] Error checking for missed deadlines:', e);
    }
  }, [id, isArmed, isDelivered, handleForceDelivery, checkDeliveryAttempted, markDeliveryAttempted]);

  // Listen for condition updates to refresh data
  useEffect(() => {
    const handleConditionUpdated = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    // Add listener for message delivery events
    const handleMessageDelivered = () => {
      console.log('[MessageDetail] Message delivered event received, refreshing data');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('message-delivered', handleMessageDelivered);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      window.removeEventListener('message-delivered', handleMessageDelivered);
    };
  }, []);

  // Save deadline to localStorage whenever it changes
  useEffect(() => {
    if (id && isArmed && deadline) {
      saveDeadlineToStorage(id, deadline.getTime());
    }
  }, [id, isArmed, deadline, saveDeadlineToStorage]);
  
  // Enhanced deadline monitoring with automatic delivery check
  useEffect(() => {
    if (!id || !isArmed || !deadline || isDelivered || !condition || condition.condition_type !== 'no_check_in' || deliveryAttempted) {
      return;
    }
    
    // Only setup the deadline monitor when we have all required data and it's not already active
    if (!deadlineMonitorActive) {
      console.log(`[MessageDetail] Setting up deadline monitor for message ${id}`);
      setDeadlineMonitorActive(true);
      
      // Set up a direct timer check in addition to the event listener
      const deadlineTime = deadline.getTime();
      const now = Date.now();
      const timeUntilDeadline = deadlineTime - now;
      
      // If deadline is in the future, set a timer
      if (timeUntilDeadline > 0) {
        console.log(`[MessageDetail] Deadline in ${timeUntilDeadline/1000} seconds, setting timer`);
        
        // Set a timer for 500ms before the deadline to ensure we don't miss it
        const timer = setTimeout(() => {
          console.log(`[MessageDetail] Direct timer triggered for deadline: ${deadline.toISOString()}`);
          
          // If not already attempted, trigger delivery
          if (!checkDeliveryAttempted(id)) {
            markDeliveryAttempted(id);
            handleForceDelivery();
          }
        }, Math.max(0, timeUntilDeadline - 500)); // 500ms before deadline
        
        return () => {
          clearTimeout(timer);
          setDeadlineMonitorActive(false);
        };
      } 
      // If deadline is already passed, trigger immediately if not attempted
      else if (!checkDeliveryAttempted(id)) {
        console.log(`[MessageDetail] Deadline already passed: ${deadline.toISOString()}`);
        console.log(`[MessageDetail] Current time: ${new Date().toISOString()}`);
        markDeliveryAttempted(id);
        
        // Small delay to allow component to fully mount
        setTimeout(() => handleForceDelivery(), 500);
      }
      
      // Add dedicated deadline reached handler with direct trigger
      const handleDeadlineReached = (event: Event) => {
        if (!id || !isArmed) return;
        
        if (event instanceof CustomEvent && event.detail) {
          console.log(`[MessageDetail] Deadline reached event received:`, event.detail);
          
          // Check if this event is for our current deadline and if delivery hasn't been attempted
          if (deadline && Math.abs(event.detail.deadlineTime - deadline.getTime()) < 10000 && !checkDeliveryAttempted(id)) { // Within 10 seconds
            console.log(`[MessageDetail] Deadline confirmed for message ${id}, triggering delivery`);
            markDeliveryAttempted(id);
            
            // Automatic trigger for deadman's switch messages when deadline is reached
            if (condition && condition.condition_type === 'no_check_in') {
              handleForceDelivery().catch(error => {
                console.error(`[MessageDetail] Failed to auto-trigger deadman switch:`, error);
                
                toast({
                  title: "Automatic delivery failed",
                  description: "Please use the 'Force Delivery' button to send the message manually",
                  variant: "destructive",
                  duration: 8000,
                });
              });
            }
          }
        }
      };
      
      window.addEventListener('deadline-reached', handleDeadlineReached);
      
      return () => {
        window.removeEventListener('deadline-reached', handleDeadlineReached);
        setDeadlineMonitorActive(false);
      };
    }
  }, [id, isArmed, deadline, condition, isDelivered, deadlineMonitorActive, deliveryAttempted, handleForceDelivery, checkDeliveryAttempted, markDeliveryAttempted]);

  // Update the local refreshTrigger whenever refreshCount changes from the hook
  useEffect(() => {
    if (refreshCount > 0) {
      console.log(`[MessageDetail] refreshCount changed to ${refreshCount}, updating refreshTrigger`);
      setRefreshTrigger(refreshCount);
    }
  }, [refreshCount]);

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <MessageDetailContent
      message={message}
      isLoading={isLoading}
      isArmed={isArmed}
      isActionLoading={isActionLoading}
      deadline={deadline}
      conditionId={conditionId}
      condition={condition}
      handleDisarmMessage={onDisarmMessage}
      handleArmMessage={onArmMessage}
      handleDelete={handleMessageDelete}
      formatDate={formatDate}
      renderConditionType={() => getConditionType(condition)}
      renderRecipients={renderRecipients}
      recipients={recipients}
      onSendTestMessage={onSendTestMessage}
      showSendTestDialog={showSendTestDialog}
      setShowSendTestDialog={setShowSendTestDialog}
      handleSendTestMessages={handleSendTestMessages}
      lastCheckIn={condition?.last_checked || null}
      checkInCode={condition?.check_in_code || null}
      lastDelivered={lastDelivered}
      isDelivered={isDelivered}
      viewCount={viewCount}
      isLoadingDelivery={isLoadingDelivery}
      refreshTrigger={refreshTrigger}
      handleForceDelivery={handleForceDelivery}
    />
  );
}
