
import { useState, useEffect, useRef } from 'react';

interface CountdownTimerOptions {
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
  onDeadlineReached?: () => void; // Add callback for direct delivery trigger
}

/**
 * A hook to manage countdown timer logic
 */
export function useCountdownTimer({
  deadline,
  isArmed,
  refreshTrigger,
  onDeadlineReached
}: CountdownTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  const [hasReachedZero, setHasReachedZero] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const deadlineReachedRef = useRef(false);
  const retryCount = useRef(0);
  
  useEffect(() => {
    // Reset state when deadline changes
    if (deadline) {
      console.log(`[useCountdownTimer] New deadline set: ${deadline.toISOString()}`);
      deadlineReachedRef.current = false;
      retryCount.current = 0;
      setHasReachedZero(false);
    }
  }, [deadline]);
  
  useEffect(() => {
    // Log for debugging
    console.log(`[useCountdownTimer] useEffect triggered with:
      - deadline: ${deadline ? deadline.toISOString() : 'null'}
      - isArmed: ${isArmed}
      - refreshTrigger: ${refreshTrigger}
      - hasCallback: ${!!onDeadlineReached}`);
    
    if (!deadline || !isArmed) {
      console.log('[useCountdownTimer] No deadline or not armed, resetting timer');
      setTimeLeft("--:--:--");
      setIsUrgent(false);
      setIsVeryUrgent(false);
      setHasReachedZero(false);
      
      // Clear any existing interval
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // Check immediately if deadline is already passed
    const now = new Date();
    const initialDifference = deadline.getTime() - now.getTime();
    
    // If deadline is already passed, trigger immediately
    if (initialDifference <= 0 && !deadlineReachedRef.current && onDeadlineReached) {
      console.log('[useCountdownTimer] Deadline already passed on load, triggering callback immediately');
      deadlineReachedRef.current = true;
      setHasReachedZero(true);
      onDeadlineReached();
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Time's up - ensure we flag this as urgent for UI updates
        setIsUrgent(true);
        setIsVeryUrgent(true);
        setHasReachedZero(true);
        
        // Direct callback when deadline is reached - this is the CRUCIAL part
        if (!deadlineReachedRef.current && onDeadlineReached) {
          console.log('[useCountdownTimer] COUNTDOWN REACHED ZERO! Triggering callback directly');
          deadlineReachedRef.current = true;
          
          try {
            onDeadlineReached();
          } catch (error) {
            console.error('[useCountdownTimer] Error in deadline reached callback:', error);
            
            // Retry logic
            if (retryCount.current < 3) {
              retryCount.current++;
              console.log(`[useCountdownTimer] Retrying callback (attempt ${retryCount.current})...`);
              
              setTimeout(() => {
                try {
                  if (onDeadlineReached) onDeadlineReached();
                } catch (retryError) {
                  console.error('[useCountdownTimer] Retry failed:', retryError);
                }
              }, 2000 * retryCount.current); // Increasing delay
            }
          }
        }
        
        return "00:00:00";
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      // Check if urgent (less than 1 hour)
      setIsUrgent(hours === 0);
      // Check if very urgent (less than 10 minutes)
      setIsVeryUrgent(hours === 0 && minutes < 10);
      
      // Format the time
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    };

    const calculatePercentage = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) return 0;
      
      // Assume a default 24 hour period if we don't know the start time
      const totalPeriod = 24 * 60 * 60 * 1000; // 24 hours in ms
      return Math.min(100, Math.max(0, (difference / totalPeriod) * 100));
    };
    
    // Update immediately
    setTimeLeft(calculateTimeLeft());
    setTimePercentage(calculatePercentage());
    
    // Clear any existing interval before setting up a new one
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    
    // Set up interval to update every second
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setTimePercentage(calculatePercentage());
    }, 1000);
    
    // Cleanup function to clear the interval when component unmounts or deps change
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deadline, isArmed, refreshTrigger, onDeadlineReached]);

  return {
    timeLeft,
    timePercentage,
    isUrgent,
    isVeryUrgent,
    hasReachedZero
  };
}
