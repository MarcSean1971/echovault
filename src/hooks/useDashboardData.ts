
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchMessageConditions,
  getNextCheckInDeadline
} from "@/services/messages/conditionService";
import { fetchMessages } from "@/services/messages/messageService";
import { MessageCondition, Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook for fetching and managing dashboard data
 */
export function useDashboardData() {
  const { userId } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conditions, setConditions] = useState<MessageCondition[]>([]);
  const [nextDeadline, setNextDeadline] = useState<Date | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch dashboard data on component mount and when user ID changes
  useEffect(() => {
    if (!userId) return;
    
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch messages and conditions
        const [messagesData, conditionsData] = await Promise.all([
          fetchMessages(),
          fetchMessageConditions(userId)
        ]);
        
        setMessages(messagesData);
        setConditions(conditionsData);
        
        // Get next check-in deadline
        const deadlineResult = await getNextCheckInDeadline(userId);
        setNextDeadline(deadlineResult ? deadlineResult : null);
        
        // Use the most recent last_checked date from conditions as the last check-in
        if (conditionsData && conditionsData.length > 0) {
          const mostRecent = conditionsData.reduce(
            (latest, condition) => {
              if (!condition.last_checked) return latest;
              const lastChecked = new Date(condition.last_checked);
              return lastChecked > latest ? lastChecked : latest;
            },
            new Date(0) // start with epoch
          );
          
          setLastCheckIn(mostRecent.toISOString());
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Error",
          description: "Could not load trigger system data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [userId]);

  // Memoize refreshConditions to prevent unnecessary re-renders
  const refreshConditions = useCallback(async () => {
    if (!userId) return null;
    
    console.log("Refreshing conditions in useDashboardData");
    setIsLoading(true);
    
    try {
      // Refresh both messages and conditions
      const [messagesData, updatedConditions] = await Promise.all([
        fetchMessages(),
        fetchMessageConditions(userId)
      ]);
      
      setMessages(messagesData);
      setConditions(updatedConditions);
      
      // Also refresh the next deadline
      const deadlineResult = await getNextCheckInDeadline(userId);
      setNextDeadline(deadlineResult ? deadlineResult : null);
      
      return updatedConditions;
    } catch (error) {
      console.error("Failed to refresh conditions:", error);
      toast({
        title: "Error",
        description: "Could not refresh conditions",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    setNextDeadline,
    lastCheckIn,
    setLastCheckIn,
    isLoading,
    userId,
    refreshConditions
  };
}
