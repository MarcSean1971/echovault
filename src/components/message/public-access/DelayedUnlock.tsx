
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DelayedUnlockProps {
  unlockTime: Date;
  onUnlock: () => void;
}

export const DelayedUnlock = ({ unlockTime, onUnlock }: DelayedUnlockProps) => {
  const [remainingTime, setRemainingTime] = useState<string>('');

  // Format remaining time
  const formatRemainingTime = (): string => {
    const now = new Date();
    const diffMs = unlockTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      onUnlock();
      return '';
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update countdown timer
  useEffect(() => {
    const intervalId = setInterval(() => {
      const formattedTime = formatRemainingTime();
      setRemainingTime(formattedTime);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [unlockTime]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <Clock className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold">Message Unlock Delayed</h2>
          <p className="text-muted-foreground">
            This message has a time-delayed unlock. It will be available in:
          </p>
          
          <div className="text-2xl font-mono font-semibold mt-2">
            {remainingTime}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Please check back later or keep this page open to access the message when the timer expires.
          </p>
        </div>
      </Card>
    </div>
  );
};
