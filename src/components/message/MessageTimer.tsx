
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
  refreshTrigger?: number; // Keep this prop to force refresh
}

export function MessageTimer({ deadline, isArmed, refreshTrigger = 0 }: MessageTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!deadline || !isArmed) {
      setTimeLeft("--:--:--");
      setIsUrgent(false);
      setIsVeryUrgent(false);
      setTimePercentage(100);
      return;
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Time's up
        setIsUrgent(true);
        setIsVeryUrgent(true);
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
    
    // Set up interval to update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setTimePercentage(calculatePercentage());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [deadline, isArmed, refreshTrigger]); // Keep refreshTrigger in dependencies
  
  // Get timer color based on percentage and urgency
  const getTimerColor = () => {
    if (!isArmed) return 'bg-gray-300';
    if (timePercentage < 10 || isVeryUrgent) return 'bg-destructive';
    if (timePercentage < 30 || isUrgent) return 'bg-orange-500';
    if (timePercentage < 60) return 'bg-amber-400';
    return 'bg-green-500';
  };
  
  return (
    <div className={isMobile ? 'px-1' : ''}>
      <div className={cn(
        "flex items-center",
        isArmed ? (
          isVeryUrgent ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-muted-foreground'
        ) : 'text-muted-foreground'
      )}>
        <Clock className="h-5 w-5 mr-1.5" />
        <span className="font-mono">
          {timeLeft}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 mt-1 mb-3">
        <div 
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            getTimerColor()
          )}
          style={{ width: isArmed ? `${timePercentage}%` : '100%' }}
        ></div>
      </div>
    </div>
  );
}
