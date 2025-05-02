
import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface MessageTimerProps {
  deadline: Date | null;
  isArmed: boolean;
}

export function MessageTimer({ deadline, isArmed }: MessageTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [timePercentage, setTimePercentage] = useState(100);
  
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
  
  // Determine urgency based on time left
  const isUrgent = timeLeft.startsWith("00:") || timePercentage < 20;
  
  return (
    <div className="space-y-2">
      <div className={`flex items-center font-mono text-lg ${isUrgent ? 'text-destructive animate-pulse' : 'text-destructive/80'}`}>
        {isUrgent ? (
          <AlertCircle className="h-4 w-4 mr-1" />
        ) : (
          <Clock className="h-4 w-4 mr-1" />
        )}
        <span className="font-bold">{timeLeft}</span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${
            timePercentage < 20 ? 'bg-destructive' : 
            timePercentage < 50 ? 'bg-orange-500' : 
            'bg-green-500'
          }`} 
          style={{ width: `${timePercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
