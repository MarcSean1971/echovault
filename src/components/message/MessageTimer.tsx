
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function MessageTimer({ deadline, isArmed }: MessageTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  
  useEffect(() => {
    if (!deadline || !isArmed) {
      setTimeLeft("--:--:--");
      return;
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Time's up
        return "00:00:00";
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      // Format the time
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    };
    
    // Update immediately
    setTimeLeft(calculateTimeLeft());
    
    // Set up interval to update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [deadline, isArmed]);
  
  if (!isArmed) {
    return null;
  }
  
  return (
    <div className="flex items-center text-sm font-medium text-destructive animate-pulse">
      <Clock className="h-4 w-4 mr-1" />
      <span>{timeLeft}</span>
    </div>
  );
}
