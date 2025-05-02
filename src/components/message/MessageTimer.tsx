
import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function MessageTimer({ deadline, isArmed }: MessageTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!deadline || !isArmed) {
      setTimeLeft("--:--:--");
      setIsUrgent(false);
      return;
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Time's up
        setIsUrgent(true);
        return "00:00:00";
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      // Check if urgent (less than 1 hour)
      setIsUrgent(hours === 0);
      
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
  }, [deadline, isArmed]);
  
  if (!isArmed) {
    return null;
  }
  
  // Get timer color based on percentage
  const getTimerColor = () => {
    if (timePercentage < 20) return 'bg-destructive';
    if (timePercentage < 50) return 'bg-orange-500';
    return 'bg-green-500';
  };
  
  return (
    <div className={`space-y-2 ${isMobile ? 'px-1' : ''}`}>
      <div className={`flex items-center justify-between ${isUrgent ? 'text-destructive animate-pulse' : 'text-destructive/80'}`}>
        <div className="flex items-center">
          {isUrgent ? (
            <AlertCircle className="h-5 w-5 mr-1.5" />
          ) : (
            <Clock className="h-5 w-5 mr-1.5" />
          )}
          <span className={`font-mono text-lg ${isUrgent ? 'font-bold' : 'font-semibold'}`}>
            {timeLeft}
          </span>
        </div>
        
        {!isMobile && (
          <div className="text-xs text-muted-foreground">
            {isUrgent ? 'Urgent' : 'Countdown'}
          </div>
        )}
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getTimerColor()}`} 
          style={{ width: `${timePercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
