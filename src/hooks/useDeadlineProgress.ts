
import { useState, useEffect } from "react";
import { intervalToDuration } from "date-fns";
import { MessageCondition } from "@/types/message";

/**
 * Custom hook to calculate deadline progress and format countdown
 */
export function useDeadlineProgress(
  isArmed: boolean, 
  deadline: Date | null, 
  condition: MessageCondition | null,
  refreshTrigger?: number
) {
  // Calculate deadline progress
  const [deadlineProgress, setDeadlineProgress] = useState(0);
  
  // Add state for countdown timer
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // Format time left as HH:MM:SS
  const formatTimeLeft = (targetDate: Date): string => {
    const now = new Date();
    if (now >= targetDate) return "00:00:00";
    
    const duration = intervalToDuration({ start: now, end: targetDate });
    
    // Format with leading zeros
    const hours = String(duration.hours || 0).padStart(2, '0');
    const minutes = String(duration.minutes || 0).padStart(2, '0');
    const seconds = String(duration.seconds || 0).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };
  
  // Update deadline progress and countdown - optimize to update every 5 seconds
  useEffect(() => {
    if (isArmed && deadline && condition?.last_checked) {
      const updateProgress = () => {
        const now = new Date();
        const lastCheck = new Date(condition.last_checked);
        const deadlineTime = deadline.getTime();
        const lastCheckTime = lastCheck.getTime();
        const currentTime = now.getTime();
        
        // Calculate what percentage of the time between last check and deadline has passed
        const totalTimeWindow = deadlineTime - lastCheckTime;
        const elapsedTime = currentTime - lastCheckTime;
        
        // Calculate progress (0-100)
        const progress = Math.min(100, Math.max(0, Math.round((elapsedTime / totalTimeWindow) * 100)));
        setDeadlineProgress(progress);
        
        // Update the time left countdown
        setTimeLeft(formatTimeLeft(deadline));
      };
      
      // Initial update
      updateProgress();
      
      // Update progress and countdown timer every 5 seconds for better performance
      const timer = setInterval(updateProgress, 5000);
      return () => clearInterval(timer);
    } else {
      setDeadlineProgress(0);
      setTimeLeft(null);
    }
  }, [isArmed, deadline, condition, refreshTrigger]);

  return { deadlineProgress, timeLeft };
}
