
import { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle, TimerOff } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number;
}

export function MessageTimer({ deadline, isArmed, refreshTrigger }: MessageTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  const [lastDeadlineTime, setLastDeadlineTime] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Log for debugging
    console.log(`[MessageTimer] useEffect triggered with:
      - deadline: ${deadline ? deadline.toISOString() : 'null'}
      - isArmed: ${isArmed}
      - refreshTrigger: ${refreshTrigger}
      - lastDeadlineTime: ${lastDeadlineTime}`);
    
    if (!deadline || !isArmed) {
      console.log('[MessageTimer] No deadline or not armed, resetting timer');
      setTimeLeft("--:--:--");
      setIsUrgent(false);
      setIsVeryUrgent(false);
      
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
      console.log(`[MessageTimer] Deadline changed from ${lastDeadlineTime} to ${currentDeadlineTime}`);
      setLastDeadlineTime(currentDeadlineTime);
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Time's up - ensure we flag this as urgent for UI updates
        setIsUrgent(true);
        setIsVeryUrgent(true);
        
        // Try to trigger the message if countdown has reached zero
        if (difference >= -5000 && difference <= 0) {
          // Dispatch an event when we're very close to or just past the deadline
          // This will allow components to react to the deadline being reached
          console.log('[MessageTimer] Dispatching deadline-reached event');
          window.dispatchEvent(new CustomEvent('deadline-reached', { 
            detail: { 
              deadlineTime: deadline.getTime(),
              currentTime: now.getTime()
            }
          }));
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
  }, [deadline, isArmed, refreshTrigger, lastDeadlineTime]);
  
  // Get timer color based on percentage and urgency
  const getTimerColor = () => {
    if (!isArmed) return 'bg-gray-300';
    if (timePercentage < 10 || isVeryUrgent) return 'bg-destructive';
    if (timePercentage < 30 || isUrgent) return 'bg-orange-500';
    if (timePercentage < 60) return 'bg-amber-400';
    return 'bg-green-500';
  };
  
  // Get pulse animation class based on urgency
  const getPulseClass = () => {
    if (!isArmed) return '';
    if (isVeryUrgent) return 'animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]';
    if (isUrgent) return 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]';
    return '';
  };
  
  return (
    <div className={cn(
      "space-y-2 p-2 rounded-lg", 
      isMobile ? 'px-1' : '',
      isArmed ? (
        isVeryUrgent ? 'bg-destructive/5' : 
        isUrgent ? 'bg-orange-50' : 
        'bg-green-50'
      ) : 'bg-muted/30',
      HOVER_TRANSITION
    )}>
      <div className={cn(
        "flex items-center justify-between transition-colors duration-300",
        isArmed ? (
          isVeryUrgent ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-destructive/80'
        ) : 'text-muted-foreground',
        isArmed && isVeryUrgent ? getPulseClass() : '',
        HOVER_TRANSITION
      )}>
        <div className="flex items-center">
          {isArmed ? (
            isVeryUrgent ? (
              <AlertCircle className={`h-5 w-5 mr-1.5 ${HOVER_TRANSITION}`} />
            ) : (
              <Clock className={`h-5 w-5 mr-1.5 ${HOVER_TRANSITION}`} />
            )
          ) : (
            <TimerOff className={`h-5 w-5 mr-1.5 ${HOVER_TRANSITION}`} />
          )}
          <span className={cn(
            "font-mono text-lg transition-all duration-300",
            isArmed ? (
              isVeryUrgent ? 'font-bold' : isUrgent ? 'font-semibold' : 'font-medium'
            ) : 'font-normal',
            HOVER_TRANSITION
          )}>
            {timeLeft}
          </span>
        </div>
        
        {!isMobile && (
          <div className={cn(
            "text-xs transition-colors duration-300",
            isArmed ? (
              isVeryUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'
            ) : 'text-muted-foreground',
            HOVER_TRANSITION
          )}>
            {isArmed ? (isVeryUrgent ? 'Critical' : isUrgent ? 'Urgent' : 'Countdown') : 'Disarmed'}
          </div>
        )}
      </div>
      
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div 
          className={cn(
            "h-2.5 rounded-full transition-all duration-500",
            getTimerColor(),
            isArmed && isVeryUrgent ? 'animate-pulse' : '',
            HOVER_TRANSITION
          )}
          style={{ width: isArmed ? `${timePercentage}%` : '100%' }}
        ></div>
      </div>
    </div>
  );
}
