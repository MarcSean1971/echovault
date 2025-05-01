
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchMessageConditions,
  getNextCheckInDeadline,
  performCheckIn
} from "@/services/messages/conditionService";
import { fetchMessages } from "@/services/messages/messageService";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition, Message } from "@/types/message";

export function useTriggerDashboard() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conditions, setConditions] = useState<MessageCondition[]>([]);
  const [nextDeadline, setNextDeadline] = useState<Date | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
        const { deadline } = await getNextCheckInDeadline(userId);
        setNextDeadline(deadline);
        
        // Use the most recent last_checked date from conditions as the last check-in
        if (conditionsData && conditionsData.length > 0) {
          const mostRecent = conditionsData.reduce(
            (latest, condition) => {
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
  
  const handleCheckIn = async () => {
    if (!userId) return;
    
    try {
      await performCheckIn(userId, "app");
      
      // Refresh deadline
      const { deadline } = await getNextCheckInDeadline(userId);
      setNextDeadline(deadline);
      setLastCheckIn(new Date().toISOString());
      
      toast({
        title: "Check-in successful",
        description: "Your dead man's switch has been reset",
      });
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "Check-in failed",
        description: "Could not perform check-in",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    handleCheckIn,
    navigate,
    userId
  };
}
