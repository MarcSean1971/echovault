
import { useState, useEffect, useRef } from 'react';

interface CountdownTimerOptions {
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
}

/**
 * A hook to manage countdown timer logic
 */
export function useCountdownTimer({
  deadline,
  isArmed,
  refreshTrigger
}: CountdownTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  const [lastDeadlineTime, setLastDeadlineTime] = useState<number | null>(null);
  const [hasTriggeredDeadlineEvent, setHasTriggeredDeadlineEvent] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Log for debugging
    console.log(`[useCountdownTimer] useEffect triggered with:
      - deadline: ${deadline ? deadline.toISOString() : 'null'}
      - isArmed: ${isArmed}
      - refreshTrigger: ${refreshTrigger}
      - lastDeadlineTime: ${lastDeadlineTime}`);
    
    if (!deadline || !isArmed) {
      console.log('[useCountdownTimer] No deadline or not armed, resetting timer');
      setTimeLeft("--:--:--");
      setIsUrgent(false);
      setIsVeryUrgent(false);
      setHasTriggeredDeadlineEvent(false);
      
      // Clear any existing interval
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // Store the deadline time for comparison
    const currentDeadlineTime = deadline.getTime();
    
    // Check if the deadline has actually changed
    if (lastDeadlineTime !== currentDeadlineTime) {
      console.log(`[useCountdownTimer] Deadline changed from ${lastDeadlineTime} to ${currentDeadlineTime}`);
      setLastDeadlineTime(currentDeadlineTime);
      setHasTriggeredDeadlineEvent(false);
    }
    
    // Check immediately if deadline is already passed
    const now = new Date();
    const initialDifference = deadline.getTime() - now.getTime();
    
    // If already passed, trigger the deadline reached event immediately
    if (initialDifference <= 0 && !hasTriggeredDeadlineEvent) {
      console.log('[useCountdownTimer] Deadline already passed on load, triggering event immediately');
      window.dispatchEvent(new CustomEvent('deadline-reached', { 
        detail: { 
          deadlineTime: deadline.getTime(),
          currentTime: now.getTime(),
          source: 'immediate-check'
        }
      }));
      setHasTriggeredDeadlineEvent(true);
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Time's up - ensure we flag this as urgent for UI updates
        setIsUrgent(true);
        setIsVeryUrgent(true);
        
        // Try to trigger the message if countdown has reached zero and we haven't triggered yet
        if (difference >= -5000 && !hasTriggeredDeadlineEvent) {
          // Dispatch an event when we're very close to or just past the deadline
          // This will allow components to react to the deadline being reached
          console.log('[useCountdownTimer] Dispatching deadline-reached event');
          window.dispatchEvent(new CustomEvent('deadline-reached', { 
            detail: { 
              deadlineTime: deadline.getTime(),
              currentTime: now.getTime(),
              source: 'timer'
            }
          }));
          
          // Mark as triggered to avoid multiple events
          setHasTriggeredDeadlineEvent(true);
          
          // Set up a backup trigger in case the first one didn't work
          setTimeout(() => {
            console.log('[useCountdownTimer] Sending backup deadline-reached event');
            window.dispatchEvent(new CustomEvent('deadline-reached', { 
              detail: { 
                deadlineTime: deadline.getTime(),
                currentTime: now.getTime(),
                source: 'timer-backup'
              }
            }));
          }, 2000); // 2 second backup
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
  }, [deadline, isArmed, refreshTrigger, lastDeadlineTime, hasTriggeredDeadlineEvent]);

  return {
    timeLeft,
    timePercentage,
    isUrgent,
    isVeryUrgent
  };
}
