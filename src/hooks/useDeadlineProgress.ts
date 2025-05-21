
import { useState, useEffect, useRef, useCallback } from "react";
import { intervalToDuration } from "date-fns";
import { MessageCondition } from "@/types/message";

/**
 * Custom hook to calculate deadline progress and format countdown
 * Optimized to reduce re-renders and prevent flickering
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
  
  // Use refs to maintain last update time and avoid unnecessary re-renders
  const lastUpdateRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  
  // Format time left as HH:MM:SS
  const formatTimeLeft = useCallback((targetDate: Date): string => {
    const now = new Date();
    if (now >= targetDate) return "00:00:00";
    
    const duration = intervalToDuration({ start: now, end: targetDate });
    
    // Format with leading zeros
    const hours = String(duration.hours || 0).padStart(2, '0');
    const minutes = String(duration.minutes || 0).padStart(2, '0');
    const seconds = String(duration.seconds || 0).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  }, []);
  
  // Update deadline progress and countdown with rate limiting
  useEffect(() => {
    if (isArmed && deadline && condition?.last_checked) {
      // Clear existing timer if any
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      const updateProgress = () => {
        const now = new Date();
        const currentTime = now.getTime();
        
        // Rate limit updates to prevent flickering (only update if 1 second has passed)
        if (currentTime - lastUpdateRef.current < 1000) {
          return;
        }
        
        lastUpdateRef.current = currentTime;
        
        const lastCheck = new Date(condition.last_checked);
        const deadlineTime = deadline.getTime();
        const lastCheckTime = lastCheck.getTime();
        
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
      // Store the timer ID in the ref so we can clean it up properly
      timerRef.current = window.setInterval(updateProgress, 5000);
      
      return () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      setDeadlineProgress(0);
      setTimeLeft(null);
    }
  }, [isArmed, deadline, condition, refreshTrigger, formatTimeLeft]);

  return { deadlineProgress, timeLeft };
}
